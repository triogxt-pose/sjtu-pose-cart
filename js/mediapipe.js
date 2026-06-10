// ===== MediaPipe 姿势比对相机 =====
// 经典照片复刻辅助拍摄模式
// 使用 MediaPipe Tasks Vision (PoseLandmarker) 进行实时骨骼检测
// 支持：多人参考骨骼线框、实时用户骨骼绘制、匹配度评分

// ===== 从真实照片提取的骨骼模板（训练后自动填充） =====
let extractedTemplates = {};
let poseLandmarkerInstance = null;  // 共享的 PoseLandmarker 实例
let tasksVisionReady = false;       // PoseLandmarker API 是否已加载

// ===== 手工占位模板（MediaPipe 不可用时的降级方案） =====
const FALLBACK_TEMPLATES = {
    classic_1_empresses: {
        person1: { 0: { x: 0.48, y: 0.10 }, 11: { x: 0.42, y: 0.22 }, 12: { x: 0.55, y: 0.22 }, 13: { x: 0.38, y: 0.48 }, 14: { x: 0.58, y: 0.48 }, 15: { x: 0.35, y: 0.68 }, 16: { x: 0.62, y: 0.68 }, 23: { x: 0.44, y: 0.52 }, 24: { x: 0.53, y: 0.52 }, 25: { x: 0.42, y: 0.75 }, 26: { x: 0.55, y: 0.75 }, 27: { x: 0.40, y: 0.92 }, 28: { x: 0.57, y: 0.92 } }
    },
    classic_2_wujing_xienan: {
        person1: { 0: { x: 0.40, y: 0.12 }, 11: { x: 0.35, y: 0.25 }, 12: { x: 0.45, y: 0.25 }, 13: { x: 0.30, y: 0.52 }, 14: { x: 0.50, y: 0.52 }, 15: { x: 0.28, y: 0.72 }, 16: { x: 0.52, y: 0.72 }, 23: { x: 0.36, y: 0.55 }, 24: { x: 0.44, y: 0.55 }, 25: { x: 0.34, y: 0.75 }, 26: { x: 0.46, y: 0.75 }, 27: { x: 0.32, y: 0.93 }, 28: { x: 0.48, y: 0.93 } },
        person2: { 0: { x: 0.60, y: 0.12 }, 11: { x: 0.55, y: 0.25 }, 12: { x: 0.65, y: 0.25 }, 13: { x: 0.50, y: 0.52 }, 14: { x: 0.70, y: 0.52 }, 15: { x: 0.48, y: 0.72 }, 16: { x: 0.72, y: 0.72 }, 23: { x: 0.56, y: 0.55 }, 24: { x: 0.64, y: 0.55 }, 25: { x: 0.54, y: 0.75 }, 26: { x: 0.66, y: 0.75 }, 27: { x: 0.52, y: 0.93 }, 28: { x: 0.68, y: 0.93 } }
    },
    classic_3_look_back: {
        person1: { 0: { x: 0.30, y: 0.15 }, 11: { x: 0.25, y: 0.28 }, 12: { x: 0.35, y: 0.28 }, 13: { x: 0.22, y: 0.55 }, 14: { x: 0.38, y: 0.55 }, 23: { x: 0.27, y: 0.55 }, 24: { x: 0.34, y: 0.55 }, 25: { x: 0.25, y: 0.76 }, 26: { x: 0.36, y: 0.76 }, 27: { x: 0.24, y: 0.93 }, 28: { x: 0.37, y: 0.93 } },
        person2: { 0: { x: 0.50, y: 0.15 }, 11: { x: 0.45, y: 0.28 }, 12: { x: 0.55, y: 0.28 }, 13: { x: 0.42, y: 0.55 }, 14: { x: 0.58, y: 0.55 }, 23: { x: 0.47, y: 0.55 }, 24: { x: 0.54, y: 0.55 }, 25: { x: 0.45, y: 0.76 }, 26: { x: 0.56, y: 0.76 }, 27: { x: 0.44, y: 0.93 }, 28: { x: 0.57, y: 0.93 } },
        person3: { 0: { x: 0.70, y: 0.15 }, 11: { x: 0.65, y: 0.28 }, 12: { x: 0.75, y: 0.28 }, 13: { x: 0.62, y: 0.55 }, 14: { x: 0.78, y: 0.55 }, 23: { x: 0.67, y: 0.55 }, 24: { x: 0.74, y: 0.55 }, 25: { x: 0.65, y: 0.76 }, 26: { x: 0.76, y: 0.76 }, 27: { x: 0.64, y: 0.93 }, 28: { x: 0.77, y: 0.93 } }
    },
    classic_3_exo: {
        person1: { 0: { x: 0.50, y: 0.12 }, 11: { x: 0.45, y: 0.25 }, 12: { x: 0.55, y: 0.25 }, 13: { x: 0.42, y: 0.50 }, 14: { x: 0.58, y: 0.50 }, 23: { x: 0.47, y: 0.52 }, 24: { x: 0.53, y: 0.52 }, 25: { x: 0.46, y: 0.75 }, 26: { x: 0.54, y: 0.75 }, 27: { x: 0.44, y: 0.93 }, 28: { x: 0.56, y: 0.93 } },
        person2: { 0: { x: 0.35, y: 0.20 }, 11: { x: 0.30, y: 0.35 }, 12: { x: 0.40, y: 0.35 }, 23: { x: 0.32, y: 0.58 }, 24: { x: 0.38, y: 0.58 }, 25: { x: 0.31, y: 0.78 }, 26: { x: 0.39, y: 0.78 } },
        person3: { 0: { x: 0.65, y: 0.20 }, 11: { x: 0.60, y: 0.35 }, 12: { x: 0.70, y: 0.35 }, 23: { x: 0.62, y: 0.58 }, 24: { x: 0.68, y: 0.58 }, 25: { x: 0.61, y: 0.78 }, 26: { x: 0.69, y: 0.78 } }
    },
    classic_4_trump: {
        person1: { 0: { x: 0.25, y: 0.15 }, 11: { x: 0.20, y: 0.30 }, 12: { x: 0.30, y: 0.30 }, 13: { x: 0.22, y: 0.50 }, 14: { x: 0.28, y: 0.50 }, 23: { x: 0.22, y: 0.55 }, 24: { x: 0.28, y: 0.55 }, 25: { x: 0.22, y: 0.76 }, 26: { x: 0.28, y: 0.76 }, 27: { x: 0.21, y: 0.93 }, 28: { x: 0.29, y: 0.93 } },
        person2: { 0: { x: 0.42, y: 0.15 }, 11: { x: 0.37, y: 0.30 }, 12: { x: 0.47, y: 0.30 }, 23: { x: 0.38, y: 0.55 }, 24: { x: 0.46, y: 0.55 }, 25: { x: 0.38, y: 0.76 }, 26: { x: 0.46, y: 0.76 }, 27: { x: 0.37, y: 0.93 }, 28: { x: 0.47, y: 0.93 } },
        person3: { 0: { x: 0.58, y: 0.15 }, 11: { x: 0.53, y: 0.30 }, 12: { x: 0.63, y: 0.30 }, 23: { x: 0.54, y: 0.55 }, 24: { x: 0.62, y: 0.55 }, 25: { x: 0.54, y: 0.76 }, 26: { x: 0.62, y: 0.76 }, 27: { x: 0.53, y: 0.93 }, 28: { x: 0.63, y: 0.93 } },
        person4: { 0: { x: 0.75, y: 0.15 }, 11: { x: 0.70, y: 0.30 }, 12: { x: 0.80, y: 0.30 }, 23: { x: 0.71, y: 0.55 }, 24: { x: 0.79, y: 0.55 }, 25: { x: 0.71, y: 0.76 }, 26: { x: 0.79, y: 0.76 }, 27: { x: 0.70, y: 0.93 }, 28: { x: 0.80, y: 0.93 } }
    },
    classic_4_empresses: {
        person1: { 0: { x: 0.40, y: 0.10 }, 11: { x: 0.35, y: 0.20 }, 12: { x: 0.45, y: 0.20 }, 23: { x: 0.36, y: 0.45 }, 24: { x: 0.44, y: 0.45 }, 25: { x: 0.35, y: 0.68 }, 26: { x: 0.45, y: 0.68 }, 27: { x: 0.35, y: 0.92 }, 28: { x: 0.45, y: 0.92 } },
        person2: { 0: { x: 0.55, y: 0.12 }, 11: { x: 0.50, y: 0.22 }, 12: { x: 0.60, y: 0.22 }, 23: { x: 0.51, y: 0.47 }, 24: { x: 0.59, y: 0.47 }, 25: { x: 0.50, y: 0.70 }, 26: { x: 0.60, y: 0.70 }, 27: { x: 0.49, y: 0.93 }, 28: { x: 0.61, y: 0.93 } },
        person3: { 0: { x: 0.33, y: 0.22 }, 11: { x: 0.28, y: 0.35 }, 12: { x: 0.38, y: 0.35 }, 23: { x: 0.29, y: 0.58 }, 24: { x: 0.37, y: 0.58 }, 25: { x: 0.28, y: 0.78 }, 26: { x: 0.38, y: 0.78 }, 27: { x: 0.28, y: 0.94 }, 28: { x: 0.38, y: 0.94 } },
        person4: { 0: { x: 0.67, y: 0.20 }, 11: { x: 0.62, y: 0.33 }, 12: { x: 0.72, y: 0.33 }, 23: { x: 0.63, y: 0.56 }, 24: { x: 0.71, y: 0.56 }, 25: { x: 0.62, y: 0.77 }, 26: { x: 0.72, y: 0.77 }, 27: { x: 0.62, y: 0.94 }, 28: { x: 0.72, y: 0.94 } }
    },
    classic_7_pro_team: {
        person1: { 0: { x: 0.45, y: 0.08 }, 11: { x: 0.40, y: 0.18 }, 12: { x: 0.50, y: 0.18 }, 23: { x: 0.41, y: 0.42 }, 24: { x: 0.49, y: 0.42 }, 25: { x: 0.40, y: 0.66 }, 26: { x: 0.50, y: 0.66 } },
        person2: { 0: { x: 0.32, y: 0.12 }, 11: { x: 0.28, y: 0.22 }, 12: { x: 0.37, y: 0.22 }, 23: { x: 0.29, y: 0.46 }, 24: { x: 0.36, y: 0.46 }, 25: { x: 0.28, y: 0.70 }, 26: { x: 0.37, y: 0.70 } },
        person3: { 0: { x: 0.57, y: 0.10 }, 11: { x: 0.52, y: 0.20 }, 12: { x: 0.62, y: 0.20 }, 23: { x: 0.53, y: 0.44 }, 24: { x: 0.61, y: 0.44 }, 25: { x: 0.52, y: 0.68 }, 26: { x: 0.62, y: 0.68 } },
        person4: { 0: { x: 0.22, y: 0.18 }, 11: { x: 0.18, y: 0.30 }, 12: { x: 0.26, y: 0.30 }, 23: { x: 0.19, y: 0.52 }, 24: { x: 0.25, y: 0.52 }, 25: { x: 0.18, y: 0.76 }, 26: { x: 0.26, y: 0.76 } },
        person5: { 0: { x: 0.37, y: 0.18 }, 11: { x: 0.33, y: 0.30 }, 12: { x: 0.41, y: 0.30 }, 23: { x: 0.34, y: 0.52 }, 24: { x: 0.40, y: 0.52 }, 25: { x: 0.33, y: 0.76 }, 26: { x: 0.41, y: 0.76 } }
    }
};

// 获取骨骼模板（优先用真实提取的，否则降级）
function getSkeletonTemplate(skeletonId) {
    if (extractedTemplates[skeletonId]) return extractedTemplates[skeletonId];
    if (FALLBACK_TEMPLATES[skeletonId]) return FALLBACK_TEMPLATES[skeletonId];
    return null;
}

// ===== 完整骨骼连接关系（33 个关键点） =====
const SKELETON_CONNECTIONS = [
    // 面部
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
    [9, 10],
    // 躯干
    [11, 12], [11, 23], [12, 24], [23, 24],
    // 左臂
    [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
    // 右臂
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
    // 左腿
    [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
    // 右腿
    [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
];

const MATCH_THRESHOLD = 0.12;

let cameraStream = null;
let animationFrameId = null;
let currentPose = null;
let canvasCtx = null;
let showSkeleton = true;

// ===== 用 PoseLandmarker 从经典照片图片中提取真实骨骼坐标（训练） =====
let templatesTraining = false;
let templatesReady = false;

async function trainPoseTemplates() {
    if (templatesTraining || templatesReady) return;
    templatesTraining = true;

    const classicPoses = POSES.filter(p => p.hasSkeleton && p.skeleton);
    if (classicPoses.length === 0) { templatesTraining = false; return; }

    console.log(`[训练] 开始从 ${classicPoses.length} 张经典照片提取骨骼...`);

    try {
        const landmarker = await getPoseLandmarker('IMAGE');
        if (!landmarker) {
            console.warn('[训练] PoseLandmarker 不可用，使用手工模板');
            templatesTraining = false;
            return;
        }

        let successCount = 0;
        for (const poseData of classicPoses) {
            try {
                const img = await loadImage(poseData.img);
                const results = landmarker.detect(img);
                if (results.landmarks && results.landmarks.length > 0) {
                    const template = {};
                    results.landmarks.forEach((personLandmarks, idx) => {
                        const key = `person${idx + 1}`;
                        template[key] = {};
                        personLandmarks.forEach((lm, i) => {
                            template[key][i] = { x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility };
                        });
                    });
                    extractedTemplates[poseData.skeleton] = template;
                    successCount++;
                    console.log(`[训练] ✅ ${poseData.name}: 检测到 ${results.landmarks.length} 人, ${results.landmarks[0].length} 个关键点`);
                } else {
                    console.warn(`[训练] ⚠️ ${poseData.name}: 未检测到人物`);
                }
            } catch (e) {
                console.warn(`[训练] ⚠️ ${poseData.name}: ${e.message}`);
            }
        }
        console.log(`[训练] 完成，成功 ${successCount}/${classicPoses.length}`);
    } catch (e) {
        console.warn('[训练] 整体失败:', e.message);
    }
    templatesTraining = false;
    templatesReady = Object.keys(extractedTemplates).length > 0;
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = src;
    });
}

// ===== 获取/创建共享 PoseLandmarker 实例 =====
async function getPoseLandmarker(runningMode) {
    if (poseLandmarkerInstance && tasksVisionReady) return poseLandmarkerInstance;

    try {
        let FilesetResolver, PoseLandmarker;

        // 尝试从全局获取
        if (typeof window !== 'undefined') {
            FilesetResolver = window.FilesetResolver;
            PoseLandmarker = window.PoseLandmarker;
        }

        // 如果全局不存在，尝试动态导入
        if (!FilesetResolver || !PoseLandmarker) {
            try {
                const mod = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/+esm');
                FilesetResolver = mod.FilesetResolver;
                PoseLandmarker = mod.PoseLandmarker;
            } catch (e) {
                console.warn('[MediaPipe] 动态导入失败:', e.message);
            }
        }

        if (!FilesetResolver || !PoseLandmarker) {
            console.warn('[MediaPipe] PoseLandmarker 不可用');
            return null;
        }

        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );

        poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
                delegate: 'GPU'
            },
            runningMode: runningMode || 'VIDEO',
            numPoses: 8,
            minPoseDetectionConfidence: 0.4,
            minPosePresenceConfidence: 0.4,
            minTrackingConfidence: 0.4
        });

        tasksVisionReady = true;
        console.log('[MediaPipe] PoseLandmarker 初始化成功 (mode:', runningMode || 'VIDEO', ')');
        return poseLandmarkerInstance;
    } catch (e) {
        console.warn('[MediaPipe] PoseLandmarker 初始化失败:', e.message);
        return null;
    }
}

// ===== 初始化摄像头 + 实时检测 =====
async function initMediaPipeCamera(pose) {
    currentPose = pose;
    const video = document.getElementById('mediapipe-video');
    const canvas = document.getElementById('mediapipe-canvas');
    const statusBar = document.getElementById('pose-match-status');
    const thumb = document.getElementById('pose-thumbnail');

    // 更新右下角缩略图
    if (thumb) {
        thumb.innerHTML = `
            <img src="${pose.img || ''}" alt="${pose.name}" onerror="this.style.display='none';this.nextElementSibling.style.height='100%';">
            <span class="thumb-label">${pose.name}</span>
        `;
    }

    // 请求摄像头
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        }).catch(() => {
            return navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
        });

        if (video) {
            video.srcObject = cameraStream;
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
        }

        if (canvas) {
            canvasCtx = canvas.getContext('2d');
        }

        if (statusBar) statusBar.textContent = '正在加载骨骼检测模型...';

        // 初始化 PoseLandmarker
        const landmarker = await getPoseLandmarker('VIDEO');
        if (!landmarker) {
            console.warn('PoseLandmarker 不可用，使用简化模式');
            if (statusBar) statusBar.textContent = '骨骼检测不可用，仅显示参考线框';
            startSimpleRender();
            return;
        }

        // 等待视频就绪
        await new Promise((resolve) => {
            if (video.readyState >= 2) { resolve(); return; }
            video.addEventListener('loadedmetadata', resolve, { once: true });
        });

        if (canvas && video) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
        }

        if (statusBar) statusBar.textContent = '准备就绪，将身体对齐参考线框';
        startRealtimeDetection(landmarker);
    } catch (err) {
        console.warn('摄像头访问失败:', err.message);
        if (statusBar) statusBar.textContent = '摄像头权限被拒绝';
        const infoEl = document.querySelector('.mediapipe-info');
        if (infoEl) {
            infoEl.innerHTML = `
                <p style="color:#e74c3c;">📷 需要摄像头权限才能使用辅助拍摄功能</p>
                <p style="font-size:12px;color:rgba(255,255,255,0.6);">
                    请在浏览器设置中允许摄像头访问，然后刷新页面重试
                </p>
                <button class="btn-primary" onclick="closeMediaPipe()" style="margin-top:12px;font-size:13px;padding:10px 24px;">← 返回</button>
            `;
        }
    }
}

// ===== 实时检测循环 =====
function startRealtimeDetection(landmarker) {
    const video = document.getElementById('mediapipe-video');
    const canvas = document.getElementById('mediapipe-canvas');
    if (!video || !canvas || !canvasCtx) return;

    let lastTime = 0;

    async function detect() {
        if (!cameraStream || !landmarker) return;

        const now = performance.now();
        // MediaPipe 建议不要每帧都检测，30fps 即可
        if (now - lastTime < 33) {
            animationFrameId = requestAnimationFrame(detect);
            return;
        }
        lastTime = now;

        try {
            const results = landmarker.detectForVideo(video, now);
            syncCanvasSize(canvas);

            if (!showSkeleton) {
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                // 绘制参考骨骼线框（多色区分多人）
                drawReferenceSkeleton(canvasCtx, canvas.width, canvas.height);
                // 绘制用户实时骨骼（蓝色）
                if (results.landmarks) {
                    drawUserSkeleton(canvasCtx, results.landmarks, canvas.width, canvas.height);
                    // 计算匹配度
                    const matchScore = calculateMatchScore(results.landmarks);
                    updateMatchStatus(matchScore);
                }
            }
        } catch (e) {
            // 检测出错时继续循环
        }

        animationFrameId = requestAnimationFrame(detect);
    }

    detect();
}

// ===== 简化渲染模式（PoseLandmarker 不可用时） =====
function startSimpleRender() {
    const canvas = document.getElementById('mediapipe-canvas');
    if (!canvas || !canvasCtx) return;

    function render() {
        if (!cameraStream) return;
        const video = document.getElementById('mediapipe-video');
        if (!video || video.readyState < 2) {
            animationFrameId = requestAnimationFrame(render);
            return;
        }

        syncCanvasSize(canvas);
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        if (showSkeleton) {
            drawReferenceSkeleton(canvasCtx, canvas.width, canvas.height);

            // 辅助框
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            canvasCtx.lineWidth = 2;
            canvasCtx.setLineDash([10, 8]);
            canvasCtx.strokeRect(
                canvas.width * 0.2, canvas.height * 0.1,
                canvas.width * 0.6, canvas.height * 0.75
            );
            canvasCtx.setLineDash([]);

            // 提示文字
            canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            canvasCtx.font = '14px sans-serif';
            canvasCtx.textAlign = 'center';
            canvasCtx.fillText('请将身体对齐参考线框', canvas.width / 2, canvas.height * 0.06);
        }

        animationFrameId = requestAnimationFrame(render);
    }
    render();
}

// ===== 同步 canvas 尺寸 =====
function syncCanvasSize(canvas) {
    const video = document.getElementById('mediapipe-video');
    if (!video || !canvas) return;
    const rect = video.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
    }
}

// ===== 绘制参考骨骼线框（多人，不同颜色） =====
function drawReferenceSkeleton(ctx, w, h) {
    if (!currentPose?.skeleton) return;
    const template = getSkeletonTemplate(currentPose.skeleton);
    if (!template) return;

    const personColors = [
        { stroke: 'rgba(255, 255, 255, 0.95)', glow: 'rgba(255, 255, 255, 0.3)', joint: 'rgba(255, 255, 255, 1)' },
        { stroke: 'rgba(255, 210, 80, 0.9)', glow: 'rgba(255, 210, 80, 0.3)', joint: 'rgba(255, 210, 80, 1)' },
        { stroke: 'rgba(80, 200, 255, 0.9)', glow: 'rgba(80, 200, 255, 0.3)', joint: 'rgba(80, 200, 255, 1)' },
        { stroke: 'rgba(255, 120, 120, 0.9)', glow: 'rgba(255, 120, 120, 0.3)', joint: 'rgba(255, 120, 120, 1)' },
        { stroke: 'rgba(120, 255, 120, 0.9)', glow: 'rgba(120, 255, 120, 0.3)', joint: 'rgba(120, 255, 120, 1)' },
        { stroke: 'rgba(255, 160, 220, 0.9)', glow: 'rgba(255, 160, 220, 0.3)', joint: 'rgba(255, 160, 220, 1)' },
        { stroke: 'rgba(220, 180, 255, 0.9)', glow: 'rgba(220, 180, 255, 0.3)', joint: 'rgba(220, 180, 255, 1)' },
        { stroke: 'rgba(255, 180, 100, 0.9)', glow: 'rgba(255, 180, 100, 0.3)', joint: 'rgba(255, 180, 100, 1)' },
    ];

    const personKeys = Object.keys(template);
    personKeys.forEach((personKey, personIdx) => {
        const keypoints = template[personKey];
        const colors = personColors[personIdx % personColors.length];

        // 外发光（粗线）
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 8;

        SKELETON_CONNECTIONS.forEach(([from, to]) => {
            const p1 = keypoints[from];
            const p2 = keypoints[to];
            if (p1 && p2 && (p1.visibility ?? 1) > 0.3 && (p2.visibility ?? 1) > 0.3) {
                ctx.beginPath();
                ctx.moveTo(p1.x * w, p1.y * h);
                ctx.lineTo(p2.x * w, p2.y * h);
                ctx.stroke();
            }
        });

        // 内层主线
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 4;
        SKELETON_CONNECTIONS.forEach(([from, to]) => {
            const p1 = keypoints[from];
            const p2 = keypoints[to];
            if (p1 && p2 && (p1.visibility ?? 1) > 0.3 && (p2.visibility ?? 1) > 0.3) {
                ctx.beginPath();
                ctx.moveTo(p1.x * w, p1.y * h);
                ctx.lineTo(p2.x * w, p2.y * h);
                ctx.stroke();
            }
        });

        // 关节点
        const drawJoint = (pt, radius) => {
            if (!pt || (pt.visibility ?? 1) < 0.3) return;
            // 外层阴影
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, radius + 2, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fill();
            // 内层高亮
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, radius, 0, 2 * Math.PI);
            ctx.fillStyle = colors.joint;
            ctx.fill();
        };

        // 主要关节点更大（肩、肘、腕、髋、膝、踝、鼻）
        const majorJoints = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
        majorJoints.forEach(i => drawJoint(keypoints[i], 7));

        // 次要关节点
        const minorJoints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 17, 18, 19, 20, 21, 22, 29, 30, 31, 32];
        minorJoints.forEach(i => drawJoint(keypoints[i], 4));
    });
}

// ===== 绘制用户实时骨骼（蓝色，所有检测到的人） =====
function drawUserSkeleton(ctx, landmarksArray, w, h) {
    if (!landmarksArray || landmarksArray.length === 0) return;

    landmarksArray.forEach((landmarks, personIdx) => {
        // 只绘制第一个人的骨骼（通常相机里只有一个人）
        if (personIdx > 0 && landmarksArray.length > 4) return;

        // 外发光
        ctx.strokeStyle = 'rgba(0, 60, 180, 0.5)';
        ctx.lineWidth = 5;

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

        // 主线
        ctx.strokeStyle = 'rgba(0, 160, 255, 0.8)';
        ctx.lineWidth = 3;

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

        // 关节点
        landmarks.forEach((pt, i) => {
            if (pt.visibility < 0.5) return;
            const isMajor = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(i);
            const r = isMajor ? 6 : 3;

            // 外圈
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, r + 2, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 40, 140, 0.6)';
            ctx.fill();

            // 内圈
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, r, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(50, 200, 255, 0.9)';
            ctx.fill();
        });
    });
}

// ===== 匹配度计算 =====
function calculateMatchScore(landmarksArray) {
    if (!currentPose?.skeleton || !landmarksArray || landmarksArray.length === 0) return 1;
    const template = getSkeletonTemplate(currentPose.skeleton);
    if (!template) return 1;

    const personKey = Object.keys(template)[0];
    const refKeypoints = template[personKey];

    // 用检测到的第一个人
    const userLandmarks = landmarksArray[0];

    let totalDist = 0;
    let count = 0;

    // 只在主要关节点上计算匹配度
    const matchJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

    matchJoints.forEach(idx => {
        const ref = refKeypoints[idx];
        const user = userLandmarks[idx];
        if (ref && user && user.visibility > 0.5) {
            const dx = ref.x - user.x;
            const dy = ref.y - user.y;
            totalDist += Math.sqrt(dx * dx + dy * dy);
            count++;
        }
    });

    return count > 0 ? totalDist / count : 1;
}

// ===== 更新匹配状态 =====
function updateMatchStatus(score) {
    const statusBar = document.getElementById('pose-match-status');
    if (!statusBar) return;

    let text, cls;
    if (score < MATCH_THRESHOLD) {
        text = '✅ 完美对齐！保持住';
        cls = 'matched';
    } else if (score < MATCH_THRESHOLD * 1.5) {
        text = '🟡 接近了！再微调一下';
        cls = 'close';
    } else {
        text = ' 将身体对齐参考线框';
        cls = '';
    }
    statusBar.textContent = text;
    statusBar.className = cls;

    // 更新进度条
    const percentEl = document.getElementById('match-percent');
    const progressEl = document.getElementById('match-progress-fill');
    if (percentEl) {
        const percent = Math.max(0, Math.round((1 - score / 0.3) * 100));
        percentEl.textContent = Math.min(100, percent) + '%';
    }
    if (progressEl) {
        const pct = Math.max(5, Math.round((1 - score / 0.3) * 100));
        progressEl.style.width = Math.min(100, pct) + '%';
    }
}

// ===== 拍照 =====
function capturePhoto() {
    const video = document.getElementById('mediapipe-video');
    const canvas = document.getElementById('mediapipe-canvas');
    if (!video || !canvas) return;

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth || 640;
    captureCanvas.height = video.videoHeight || 480;
    const ctx = captureCanvas.getContext('2d');

    ctx.drawImage(video, 0, 0);
    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `sjtu_graduation_${Date.now()}.png`;
    link.href = captureCanvas.toDataURL('image/png');
    link.click();

    showToast('照片已保存！');
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
    currentPose = null;
}

// ===== 切换骨骼显示 =====
function toggleSkeleton() {
    showSkeleton = !showSkeleton;
    const canvas = document.getElementById('mediapipe-canvas');
    if (canvas) canvas.style.display = showSkeleton ? '' : 'none';
    const btn = document.getElementById('btn-toggle-skeleton');
    if (btn) btn.textContent = showSkeleton ? '👁️' : '👁️‍🗨️';
}