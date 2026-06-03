// ===== MediaPipe 姿势比对相机 =====
// 经典照片复刻辅助拍摄模式
// 支持参考骨骼线框叠加、实时骨架绘制、匹配度检测

// 经典照片骨骼模板（归一化坐标，基于 MediaPipe Pose 33 关键点）
// 这些模板的关节点坐标需要在实际使用时通过 MediaPipe 从经典照片中提取
// 当前为占位模板，使用后可替换为从真实照片提取的准确坐标
const SKELETON_TEMPLATES = {
    // 经典·甄嬛传(单人)：单人站立，侧身回眸
    classic_1_empresses: {
        person1: {
            11: { x: 0.42, y: 0.22 }, // 左肩
            12: { x: 0.55, y: 0.22 }, // 右肩
            13: { x: 0.38, y: 0.48 }, // 左肘
            14: { x: 0.58, y: 0.48 }, // 右肘
            15: { x: 0.35, y: 0.68 }, // 左腕
            16: { x: 0.62, y: 0.68 }, // 右腕
            23: { x: 0.44, y: 0.52 }, // 左胯
            24: { x: 0.53, y: 0.52 }  // 右胯
        }
    },
    // 经典·吴京谢楠(双人)：双人并肩站立，一人搭肩
    classic_2_wujing_xienan: {
        person1: {
            11: { x: 0.35, y: 0.25 },
            12: { x: 0.45, y: 0.25 },
            13: { x: 0.30, y: 0.55 },
            14: { x: 0.50, y: 0.55 },
            23: { x: 0.35, y: 0.52 },
            24: { x: 0.45, y: 0.52 }
        },
        person2: {
            11: { x: 0.55, y: 0.25 },
            12: { x: 0.65, y: 0.25 },
            13: { x: 0.50, y: 0.55 },
            14: { x: 0.70, y: 0.55 },
            23: { x: 0.55, y: 0.52 },
            24: { x: 0.65, y: 0.52 }
        }
    },
    // 经典·回头的诱惑(三人)：三人并排，同步回头
    classic_3_look_back: {
        person1: {
            11: { x: 0.25, y: 0.28 },
            12: { x: 0.35, y: 0.28 },
            23: { x: 0.27, y: 0.55 },
            24: { x: 0.34, y: 0.55 }
        },
        person2: {
            11: { x: 0.45, y: 0.28 },
            12: { x: 0.55, y: 0.28 },
            23: { x: 0.46, y: 0.55 },
            24: { x: 0.54, y: 0.55 }
        },
        person3: {
            11: { x: 0.65, y: 0.28 },
            12: { x: 0.75, y: 0.28 },
            23: { x: 0.66, y: 0.55 },
            24: { x: 0.74, y: 0.55 }
        }
    },
    // 经典·EXO(三人)：三人V字队形
    classic_3_exo: {
        person1: {
            11: { x: 0.45, y: 0.25 },
            12: { x: 0.55, y: 0.25 },
            13: { x: 0.42, y: 0.50 },
            14: { x: 0.58, y: 0.50 },
            23: { x: 0.46, y: 0.52 },
            24: { x: 0.54, y: 0.52 }
        },
        person2: {
            11: { x: 0.30, y: 0.35 },
            12: { x: 0.40, y: 0.35 },
            23: { x: 0.32, y: 0.58 },
            24: { x: 0.38, y: 0.58 }
        },
        person3: {
            11: { x: 0.60, y: 0.35 },
            12: { x: 0.70, y: 0.35 },
            23: { x: 0.62, y: 0.58 },
            24: { x: 0.68, y: 0.58 }
        }
    },
    // 经典·特朗普(四人)：四人排成一排，双手交叉
    classic_4_trump: {
        person1: {
            11: { x: 0.20, y: 0.30 },
            12: { x: 0.30, y: 0.30 },
            13: { x: 0.22, y: 0.50 },
            14: { x: 0.28, y: 0.50 },
            23: { x: 0.22, y: 0.55 },
            24: { x: 0.28, y: 0.55 }
        },
        person2: {
            11: { x: 0.37, y: 0.30 },
            12: { x: 0.47, y: 0.30 },
            23: { x: 0.38, y: 0.55 },
            24: { x: 0.46, y: 0.55 }
        },
        person3: {
            11: { x: 0.53, y: 0.30 },
            12: { x: 0.63, y: 0.30 },
            23: { x: 0.54, y: 0.55 },
            24: { x: 0.62, y: 0.55 }
        },
        person4: {
            11: { x: 0.70, y: 0.30 },
            12: { x: 0.80, y: 0.30 },
            23: { x: 0.71, y: 0.55 },
            24: { x: 0.79, y: 0.55 }
        }
    },
    // 经典·甄嬛传(四人)：四人前后错落
    classic_4_empresses: {
        person1: {
            11: { x: 0.35, y: 0.20 },
            12: { x: 0.45, y: 0.20 },
            23: { x: 0.36, y: 0.45 },
            24: { x: 0.44, y: 0.45 }
        },
        person2: {
            11: { x: 0.50, y: 0.22 },
            12: { x: 0.60, y: 0.22 },
            23: { x: 0.51, y: 0.47 },
            24: { x: 0.59, y: 0.47 }
        },
        person3: {
            11: { x: 0.28, y: 0.35 },
            12: { x: 0.38, y: 0.35 },
            23: { x: 0.29, y: 0.58 },
            24: { x: 0.37, y: 0.58 }
        },
        person4: {
            11: { x: 0.62, y: 0.33 },
            12: { x: 0.72, y: 0.33 },
            23: { x: 0.63, y: 0.56 },
            24: { x: 0.71, y: 0.56 }
        }
    },
    // 经典·专业团队(七人)：七人呈梯形排列
    classic_7_pro_team: {
        person1: {
            11: { x: 0.40, y: 0.18 },
            12: { x: 0.50, y: 0.18 },
            23: { x: 0.41, y: 0.42 },
            24: { x: 0.49, y: 0.42 }
        },
        person2: {
            11: { x: 0.28, y: 0.22 },
            12: { x: 0.37, y: 0.22 },
            23: { x: 0.29, y: 0.46 },
            24: { x: 0.36, y: 0.46 }
        },
        person3: {
            11: { x: 0.52, y: 0.20 },
            12: { x: 0.62, y: 0.20 },
            23: { x: 0.53, y: 0.44 },
            24: { x: 0.61, y: 0.44 }
        },
        person4: {
            11: { x: 0.18, y: 0.30 },
            12: { x: 0.26, y: 0.30 },
            23: { x: 0.19, y: 0.52 },
            24: { x: 0.25, y: 0.52 }
        },
        person5: {
            11: { x: 0.33, y: 0.30 },
            12: { x: 0.41, y: 0.30 },
            23: { x: 0.34, y: 0.52 },
            24: { x: 0.40, y: 0.52 }
        }
    }
};

// 骨骼连接关系
const SKELETON_CONNECTIONS = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // 上半身
    [11, 23], [12, 24], [23, 24], // 躯干
    [23, 25], [25, 27], [24, 26], [26, 28] // 下半身
];

const MATCH_THRESHOLD = 0.12; // 匹配距离阈值

let cameraStream = null;
let mediaPipeReady = false;
let animationFrameId = null;
let currentPose = null;
let canvasCtx = null;

// ===== 初始化 MediaPipe 相机 =====
async function initMediaPipeCamera(pose) {
    currentPose = pose;
    const container = document.getElementById('camera-container');
    const statusBar = document.getElementById('camera-status');
    if (!container) return;

    // 渲染相机UI
    container.innerHTML = `
        <video id="camera-video" autoplay playsinline style="width:100%;height:100%;object-fit:cover;"></video>
        <canvas id="camera-canvas" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></canvas>
        <div class="camera-overlay">
            <div class="camera-guide">将身体对齐白色线框</div>
        </div>
        <div class="camera-controls">
            <button class="cam-btn cam-back" onclick="stopCamera()">← 返回</button>
            <button class="cam-btn cam-shutter" onclick="capturePhoto()">📸</button>
            <button class="cam-btn cam-skeleton" onclick="toggleSkeleton()">🦴</button>
        </div>
        <div class="camera-thumbnail" id="camera-thumbnail">
            <span style="font-size:32px;">${pose.emoji || '🕺'}</span>
            <span style="font-size:11px;">${pose.name}</span>
        </div>
    `;

    // 请求摄像头
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        const video = document.getElementById('camera-video');
        video.srcObject = cameraStream;

        const canvas = document.getElementById('camera-canvas');
        canvasCtx = canvas.getContext('2d');

        video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            if (statusBar) statusBar.textContent = '准备就绪，将身体对齐白色线框';
        });

        // 尝试加载 MediaPipe
        await loadMediaPipe();
    } catch (err) {
        if (statusBar) statusBar.textContent = '摄像头权限被拒绝';
        container.innerHTML += `
            <div class="camera-permission-denied">
                <p>📷 需要摄像头权限才能使用辅助拍摄功能</p>
                <p>请在浏览器设置中允许摄像头访问</p>
            </div>
        `;
    }
}

// ===== 加载 MediaPipe =====
async function loadMediaPipe() {
    try {
        if (typeof Pose === 'undefined') {
            // MediaPipe 未加载，降级为简单模式
            console.warn('MediaPipe 未加载，使用简化骨骼绘制');
            mediaPipeReady = false;
            startSimpleRender();
            return;
        }

        const pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults(onMediaPipeResults);
        mediaPipeReady = true;

        // 开始处理帧
        processFrame(pose);
    } catch (err) {
        console.warn('MediaPipe 加载失败:', err);
        mediaPipeReady = false;
        startSimpleRender();
    }
}

function processFrame(pose) {
    const video = document.getElementById('camera-video');
    if (!video) return;

    async function detect() {
        if (!cameraStream) return;
        await pose.send({ image: video });
        animationFrameId = requestAnimationFrame(detect);
    }
    detect();
}

// ===== MediaPipe 结果处理 =====
function onMediaPipeResults(results) {
    const canvas = document.getElementById('camera-canvas');
    if (!canvas || !canvasCtx) return;

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制参考骨骼线框（白色）
    drawReferenceSkeleton(canvasCtx, canvas.width, canvas.height);

    // 绘制用户骨骼（半透明蓝色）
    if (results.poseLandmarks) {
        drawUserSkeleton(canvasCtx, results.poseLandmarks, canvas.width, canvas.height);

        // 检测匹配度
        const matchScore = calculateMatchScore(results.poseLandmarks);
        updateMatchStatus(matchScore);
    }
}

// 绘制参考骨骼线框
function drawReferenceSkeleton(ctx, w, h) {
    if (!currentPose?.skeleton) return;
    const template = SKELETON_TEMPLATES[currentPose.skeleton];
    if (!template) return;

    const personKey = Object.keys(template)[0]; // 取第一个人
    const keypoints = template[personKey];

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

    // 绘制连接线
    SKELETON_CONNECTIONS.forEach(([from, to]) => {
        const p1 = keypoints[from];
        const p2 = keypoints[to];
        if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x * w, p1.y * h);
            ctx.lineTo(p2.x * w, p2.y * h);
            ctx.stroke();
        }
    });

    // 绘制关节点
    Object.values(keypoints).forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x * w, pt.y * h, 5, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// 绘制用户骨骼
function drawUserSkeleton(ctx, landmarks, w, h) {
    ctx.strokeStyle = 'rgba(0, 120, 220, 0.5)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(0, 120, 220, 0.7)';

    SKELETON_CONNECTIONS.forEach(([from, to]) => {
        const p1 = landmarks[from];
        const p2 = landmarks[to];
        if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
            ctx.beginPath();
            ctx.moveTo(p1.x * w, p1.y * h);
            ctx.lineTo(p2.x * w, p2.y * h);
            ctx.stroke();
        }
    });

    landmarks.forEach((pt, i) => {
        if (pt.visibility > 0.5 && SKELETON_TEMPLATES[currentPose.skeleton]?.[Object.keys(SKELETON_TEMPLATES[currentPose.skeleton])[0]]?.[i]) {
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
}

// ===== 匹配度计算 =====
function calculateMatchScore(landmarks) {
    if (!currentPose?.skeleton) return 1;
    const template = SKELETON_TEMPLATES[currentPose.skeleton];
    if (!template) return 1;

    const personKey = Object.keys(template)[0];
    const refKeypoints = template[personKey];

    let totalDist = 0;
    let count = 0;

    Object.keys(refKeypoints).forEach(idx => {
        const ref = refKeypoints[idx];
        const user = landmarks[idx];
        if (user && user.visibility > 0.5) {
            const dx = ref.x - user.x;
            const dy = ref.y - user.y;
            totalDist += Math.sqrt(dx * dx + dy * dy);
            count++;
        }
    });

    return count > 0 ? totalDist / count : 1;
}

// 更新匹配状态
function updateMatchStatus(score) {
    const statusBar = document.getElementById('camera-status');
    if (!statusBar) return;

    if (score < MATCH_THRESHOLD) {
        statusBar.textContent = '✅ 完美对齐！快按快门';
        statusBar.className = 'camera-status matched';
    } else if (score < MATCH_THRESHOLD * 1.5) {
        statusBar.textContent = '接近了！再微调一下位置';
        statusBar.className = 'camera-status close';
    } else {
        statusBar.textContent = '将身体对齐白色线框';
        statusBar.className = 'camera-status';
    }
}

// ===== 简化渲染模式（MediaPipe 不可用时） =====
function startSimpleRender() {
    const canvas = document.getElementById('camera-canvas');
    if (!canvas || !canvasCtx) return;

    function render() {
        if (!cameraStream) return;
        const video = document.getElementById('camera-video');
        if (!video || video.readyState < 2) {
            animationFrameId = requestAnimationFrame(render);
            return;
        }

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制参考线框
        drawReferenceSkeleton(canvasCtx, canvas.width, canvas.height);

        // 绘制虚线辅助框
        canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        canvasCtx.lineWidth = 2;
        canvasCtx.setLineDash([10, 8]);
        canvasCtx.strokeRect(
            canvas.width * 0.25, canvas.height * 0.1,
            canvas.width * 0.5, canvas.height * 0.7
        );
        canvasCtx.setLineDash([]);

        animationFrameId = requestAnimationFrame(render);
    }
    render();
}

// ===== 拍照 =====
function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    if (!video || !canvas) return;

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const ctx = captureCanvas.getContext('2d');

    // 绘制视频帧
    ctx.drawImage(video, 0, 0);

    // 叠加画布内容（骨骼线框）
    ctx.drawImage(canvas, 0, 0);

    // 下载图片
    const link = document.createElement('a');
    link.download = `sjtu_graduation_${Date.now()}.png`;
    link.href = captureCanvas.toDataURL('image/png');
    link.click();

    showToast('照片已保存！已加入你的毕业企划素材');
}

// ===== 停止相机 =====
function stopCamera() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    canvasCtx = null;
    mediaPipeReady = false;
    currentPose = null;
    goBack();
}

// ===== 切换骨骼显示 =====
let showSkeleton = true;
function toggleSkeleton() {
    showSkeleton = !showSkeleton;
    const canvas = document.getElementById('camera-canvas');
    if (canvas) canvas.style.display = showSkeleton ? 'block' : 'none';
}