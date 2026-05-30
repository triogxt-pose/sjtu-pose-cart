// ===== MediaPipe 姿势比对 =====
// 参考 chapter_5_demo/MediaPipe demo 的写法
// 使用 MediaPipe Pose Landmarker 进行实时姿态识别与比对

let mediaPipeRunning = false;
let poseLandmarker = null;
let animationId = null;
let lastVideoTime = -1;
let targetPose = null;  // 目标姿势的关键点数据

// MediaPipe Pose 关键点连接关系 (参考 demo_1_hands_landmarks 的写法)
const POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 7],    // 左脸-左耳
    [0, 4], [4, 5], [5, 6], [6, 8],    // 右脸-右耳
    [9, 10],                              // 嘴唇
    [11, 12],                             // 肩膀
    [11, 13], [13, 15],                   // 左上臂-左前臂
    [12, 14], [14, 16],                   // 右上臂-右前臂
    [11, 23], [12, 24], [23, 24],        // 躯干
    [23, 25], [25, 27], [27, 29], [29, 31],  // 左腿
    [24, 26], [26, 28], [28, 30], [30, 32],  // 右腿
];

// 示例目标姿势（1920老照片参考姿势 - 标准站立）
// TODO: 上传真实姿势训练照片后，可通过Python脚本提取关键点数据
const SAMPLE_TARGET_POSE = {
    name: '复刻1920老照片',
    // 归一化坐标 (x, y, z, visibility)
    landmarks: [
        // 0-10: 面部 (简化)
        { x: 0.48, y: 0.15, z: -0.2, visibility: 0.9 },
        { x: 0.47, y: 0.13, z: -0.2, visibility: 0.9 },
        { x: 0.46, y: 0.12, z: -0.2, visibility: 0.9 },
        { x: 0.45, y: 0.11, z: -0.2, visibility: 0.9 },
        { x: 0.52, y: 0.13, z: -0.2, visibility: 0.9 },
        { x: 0.53, y: 0.12, z: -0.2, visibility: 0.9 },
        { x: 0.54, y: 0.11, z: -0.2, visibility: 0.9 },
        { x: 0.43, y: 0.13, z: -0.2, visibility: 0.9 },
        { x: 0.55, y: 0.13, z: -0.2, visibility: 0.9 },
        { x: 0.49, y: 0.17, z: -0.2, visibility: 0.9 },
        { x: 0.51, y: 0.17, z: -0.2, visibility: 0.9 },
        // 11-12: 肩膀
        { x: 0.40, y: 0.32, z: -0.3, visibility: 0.99 },
        { x: 0.60, y: 0.32, z: -0.3, visibility: 0.99 },
        // 13-14: 肘部
        { x: 0.32, y: 0.45, z: -0.3, visibility: 0.99 },
        { x: 0.68, y: 0.45, z: -0.3, visibility: 0.99 },
        // 15-16: 手腕
        { x: 0.25, y: 0.58, z: -0.3, visibility: 0.99 },
        { x: 0.75, y: 0.58, z: -0.3, visibility: 0.99 },
        // 17-22: 手部 (简化)
        { x: 0.23, y: 0.60, z: -0.3, visibility: 0.9 },
        { x: 0.22, y: 0.62, z: -0.3, visibility: 0.9 },
        { x: 0.24, y: 0.63, z: -0.3, visibility: 0.9 },
        { x: 0.21, y: 0.61, z: -0.3, visibility: 0.9 },
        { x: 0.77, y: 0.60, z: -0.3, visibility: 0.9 },
        { x: 0.78, y: 0.62, z: -0.3, visibility: 0.9 },
        // 23-24: 髋部
        { x: 0.44, y: 0.62, z: -0.3, visibility: 0.99 },
        { x: 0.56, y: 0.62, z: -0.3, visibility: 0.99 },
        // 25-26: 膝盖
        { x: 0.42, y: 0.78, z: -0.3, visibility: 0.99 },
        { x: 0.58, y: 0.78, z: -0.3, visibility: 0.99 },
        // 27-28: 脚踝
        { x: 0.40, y: 0.93, z: -0.3, visibility: 0.99 },
        { x: 0.60, y: 0.93, z: -0.3, visibility: 0.99 },
        // 29-32: 脚部
        { x: 0.38, y: 0.97, z: -0.3, visibility: 0.9 },
        { x: 0.42, y: 0.98, z: -0.3, visibility: 0.9 },
        { x: 0.58, y: 0.97, z: -0.3, visibility: 0.9 },
        { x: 0.62, y: 0.98, z: -0.3, visibility: 0.9 },
    ]
};

async function openMediaPipe() {
    document.getElementById('modal-mediapipe').classList.add('show');
    
    try {
        const { PoseLandmarker, FilesetResolver } = await import(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );

        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );

        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
                delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        await startCamera();
        mediaPipeRunning = true;
        predictWebcam();
    } catch (error) {
        console.error('MediaPipe 初始化失败:', error);
        document.getElementById('pose-match-status').textContent = '初始化失败，请检查网络连接';
        
        // 降级方案：显示模拟姿势检测
        startSimulatedPoseDetection();
    }
}

function closeMediaPipe() {
    mediaPipeRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (poseLandmarker) {
        poseLandmarker.close();
        poseLandmarker = null;
    }
    // 停止摄像头
    const video = document.getElementById('mediapipe-video');
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    document.getElementById('modal-mediapipe').classList.remove('show');
}

async function startCamera() {
    const video = document.getElementById('mediapipe-video');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 640 } }
        });
        video.srcObject = stream;
        await video.play();
    } catch (error) {
        console.error('无法打开摄像头:', error);
        document.getElementById('pose-match-status').textContent = '无法访问摄像头';
    }
}

async function predictWebcam() {
    if (!mediaPipeRunning) return;

    const video = document.getElementById('mediapipe-video');
    const canvas = document.getElementById('mediapipe-canvas');
    const ctx = canvas.getContext('2d');

    if (video.readyState >= 2) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const startTimeMs = performance.now();

        if (lastVideoTime !== video.currentTime) {
            lastVideoTime = video.currentTime;
            const results = await poseLandmarker.detectForVideo(video, startTimeMs);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (results.landmarks && results.landmarks.length > 0) {
                const landmarks = results.landmarks[0];
                
                // 绘制检测到的骨骼 (参考 demo_1_hands_landmarks 写法)
                drawPoseSkeleton(ctx, landmarks, canvas.width, canvas.height);
                
                // 计算匹配度
                if (targetPose) {
                    const matchPercent = calculatePoseMatch(landmarks, targetPose.landmarks);
                    updateMatchProgress(matchPercent);
                } else {
                    drawTargetSkeleton(ctx, canvas.width, canvas.height);
                    // 使用简化匹配
                    const matchPercent = calculatePoseMatch(landmarks, SAMPLE_TARGET_POSE.landmarks);
                    updateMatchProgress(matchPercent);
                }
            } else {
                document.getElementById('pose-match-status').textContent = '未检测到人体';
                updateMatchProgress(0);
            }
        }
    }

    animationId = requestAnimationFrame(predictWebcam);
}

// 绘制骨骼线框 (参考 demo 的 draw_hand_landmarks 写法)
function drawPoseSkeleton(ctx, landmarks, width, height) {
    // 绘制连接线
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (const [start, end] of POSE_CONNECTIONS) {
        const p1 = landmarks[start];
        const p2 = landmarks[end];
        if (p1.visibility > 0.5 && p2.visibility > 0.5) {
            ctx.beginPath();
            ctx.moveTo(p1.x * width, p1.y * height);
            ctx.lineTo(p2.x * width, p2.y * height);
            ctx.stroke();
        }
    }

    // 绘制关键点
    for (let i = 0; i < landmarks.length; i++) {
        const p = landmarks[i];
        if (p.visibility > 0.5) {
            ctx.beginPath();
            ctx.arc(p.x * width, p.y * height, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#00ff88';
            ctx.fill();
        }
    }
}

// 绘制目标姿势的骨骼线框（灰色参考线）
function drawTargetSkeleton(ctx, width, height) {
    if (!targetPose && !SAMPLE_TARGET_POSE) return;

    const landmarks = targetPose ? targetPose.landmarks : SAMPLE_TARGET_POSE.landmarks;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.lineCap = 'round';

    for (const [start, end] of POSE_CONNECTIONS) {
        const p1 = landmarks[start];
        const p2 = landmarks[end];
        if (p1.visibility > 0.5 && p2.visibility > 0.5) {
            ctx.beginPath();
            ctx.moveTo(p1.x * width, p1.y * height);
            ctx.lineTo(p2.x * width, p2.y * height);
            ctx.stroke();
        }
    }

    ctx.setLineDash([]);

    for (let i = 0; i < landmarks.length; i++) {
        const p = landmarks[i];
        if (p.visibility > 0.5) {
            ctx.beginPath();
            ctx.arc(p.x * width, p.y * height, 3, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();
        }
    }
}

// 计算姿势匹配度 (参考分类/识别的相似度计算)
function calculatePoseMatch(detected, target) {
    if (!detected || !target) return 0;

    let totalDist = 0;
    let validPoints = 0;

    // 只比较身体关键点（肩膀、肘部、手腕、髋部、膝盖、脚踝）
    const bodyKeypoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

    for (const idx of bodyKeypoints) {
        if (idx < detected.length && idx < target.length) {
            const dp = detected[idx];
            const tp = target[idx];
            if (dp.visibility > 0.5 && tp.visibility > 0.5) {
                const dx = dp.x - tp.x;
                const dy = dp.y - tp.y;
                totalDist += Math.sqrt(dx * dx + dy * dy);
                validPoints++;
            }
        }
    }

    if (validPoints === 0) return 0;

    const avgDist = totalDist / validPoints;
    // 转换为百分比：距离越小，匹配度越高
    const matchPercent = Math.max(0, Math.min(100, (1 - avgDist / 0.5) * 100));
    return matchPercent;
}

function updateMatchProgress(percent) {
    const fill = document.getElementById('match-progress-fill');
    const percentEl = document.getElementById('match-percent');
    const statusEl = document.getElementById('pose-match-status');
    
    if (fill) fill.style.width = percent + '%';
    if (percentEl) percentEl.textContent = Math.round(percent) + '%';
    
    if (statusEl) {
        if (percent >= 80) {
            statusEl.textContent = '✅ 姿势完美！可以拍照';
            statusEl.style.color = '#2ecc71';
            if (fill) fill.style.background = '#2ecc71';
        } else if (percent >= 50) {
            statusEl.textContent = '🟡 继续调整姿势...';
            statusEl.style.color = '#f5a623';
            if (fill) fill.style.background = 'linear-gradient(90deg, #e74c3c, #f5a623)';
        } else {
            statusEl.textContent = '🔴 请对准骨骼线框';
            statusEl.style.color = '#e74c3c';
            if (fill) fill.style.background = '#e74c3c';
        }
    }
}

// 模拟姿势检测（MediaPipe不可用时的降级方案）
function startSimulatedPoseDetection() {
    let progress = 0;
    const interval = setInterval(() => {
        if (!mediaPipeRunning) {
            clearInterval(interval);
            return;
        }
        progress = Math.min(100, progress + Math.random() * 15);
        updateMatchProgress(progress);
        
        const statusEl = document.getElementById('pose-match-status');
        if (statusEl && progress < 30) {
            statusEl.textContent = '🔴 请对准骨骼线框 (模拟)';
        }
    }, 800);
}

function setTargetPose(poseId) {
    const pose = POSES.find(p => p.id === poseId);
    if (pose && pose.hasSkeleton) {
        // TODO: 加载该姿势对应的骨骼数据
        targetPose = SAMPLE_TARGET_POSE;
        targetPose.name = pose.name;
    } else {
        targetPose = null;
    }
}

// 拍照保存功能
function capturePhoto() {
    const canvas = document.getElementById('mediapipe-canvas');
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'pose_photo_' + Date.now() + '.png';
    link.href = dataUrl;
    link.click();
    showToast('照片已保存');
}