// ===== MediaPipe 姿势比对相机 =====
// 经典照片复刻辅助拍摄模式
// 支持参考骨骼线框叠加、实时骨架绘制、匹配度检测

// ===== 骨骼模板——优先使用 MediaPipe 从真实照片提取，降级为手工坐标 =====
// extractedTemplates 会在页面加载时通过 trainPoseTemplates() 自动填充
let extractedTemplates = {};

// 手工占位模板（MediaPipe 不可用时的降级方案）
const FALLBACK_TEMPLATES = {
    classic_1_empresses: {
        person1: { 11: { x: 0.42, y: 0.22 }, 12: { x: 0.55, y: 0.22 }, 13: { x: 0.38, y: 0.48 }, 14: { x: 0.58, y: 0.48 }, 15: { x: 0.35, y: 0.68 }, 16: { x: 0.62, y: 0.68 }, 23: { x: 0.44, y: 0.52 }, 24: { x: 0.53, y: 0.52 } }
    },
    classic_2_wujing_xienan: {
        person1: { 11: { x: 0.35, y: 0.25 }, 12: { x: 0.45, y: 0.25 }, 13: { x: 0.30, y: 0.55 }, 14: { x: 0.50, y: 0.55 }, 23: { x: 0.35, y: 0.52 }, 24: { x: 0.45, y: 0.52 } },
        person2: { 11: { x: 0.55, y: 0.25 }, 12: { x: 0.65, y: 0.25 }, 13: { x: 0.50, y: 0.55 }, 14: { x: 0.70, y: 0.55 }, 23: { x: 0.55, y: 0.52 }, 24: { x: 0.65, y: 0.52 } }
    },
    classic_3_look_back: {
        person1: { 11: { x: 0.25, y: 0.28 }, 12: { x: 0.35, y: 0.28 }, 23: { x: 0.27, y: 0.55 }, 24: { x: 0.34, y: 0.55 } },
        person2: { 11: { x: 0.45, y: 0.28 }, 12: { x: 0.55, y: 0.28 }, 23: { x: 0.46, y: 0.55 }, 24: { x: 0.54, y: 0.55 } },
        person3: { 11: { x: 0.65, y: 0.28 }, 12: { x: 0.75, y: 0.28 }, 23: { x: 0.66, y: 0.55 }, 24: { x: 0.74, y: 0.55 } }
    },
    classic_3_exo: {
        person1: { 11: { x: 0.45, y: 0.25 }, 12: { x: 0.55, y: 0.25 }, 13: { x: 0.42, y: 0.50 }, 14: { x: 0.58, y: 0.50 }, 23: { x: 0.46, y: 0.52 }, 24: { x: 0.54, y: 0.52 } },
        person2: { 11: { x: 0.30, y: 0.35 }, 12: { x: 0.40, y: 0.35 }, 23: { x: 0.32, y: 0.58 }, 24: { x: 0.38, y: 0.58 } },
        person3: { 11: { x: 0.60, y: 0.35 }, 12: { x: 0.70, y: 0.35 }, 23: { x: 0.62, y: 0.58 }, 24: { x: 0.68, y: 0.58 } }
    },
    classic_4_trump: {
        person1: { 11: { x: 0.20, y: 0.30 }, 12: { x: 0.30, y: 0.30 }, 13: { x: 0.22, y: 0.50 }, 14: { x: 0.28, y: 0.50 }, 23: { x: 0.22, y: 0.55 }, 24: { x: 0.28, y: 0.55 } },
        person2: { 11: { x: 0.37, y: 0.30 }, 12: { x: 0.47, y: 0.30 }, 23: { x: 0.38, y: 0.55 }, 24: { x: 0.46, y: 0.55 } },
        person3: { 11: { x: 0.53, y: 0.30 }, 12: { x: 0.63, y: 0.30 }, 23: { x: 0.54, y: 0.55 }, 24: { x: 0.62, y: 0.55 } },
        person4: { 11: { x: 0.70, y: 0.30 }, 12: { x: 0.80, y: 0.30 }, 23: { x: 0.71, y: 0.55 }, 24: { x: 0.79, y: 0.55 } }
    },
    classic_4_empresses: {
        person1: { 11: { x: 0.35, y: 0.20 }, 12: { x: 0.45, y: 0.20 }, 23: { x: 0.36, y: 0.45 }, 24: { x: 0.44, y: 0.45 } },
        person2: { 11: { x: 0.50, y: 0.22 }, 12: { x: 0.60, y: 0.22 }, 23: { x: 0.51, y: 0.47 }, 24: { x: 0.59, y: 0.47 } },
        person3: { 11: { x: 0.28, y: 0.35 }, 12: { x: 0.38, y: 0.35 }, 23: { x: 0.29, y: 0.58 }, 24: { x: 0.37, y: 0.58 } },
        person4: { 11: { x: 0.62, y: 0.33 }, 12: { x: 0.72, y: 0.33 }, 23: { x: 0.63, y: 0.56 }, 24: { x: 0.71, y: 0.56 } }
    },
    classic_7_pro_team: {
        person1: { 11: { x: 0.40, y: 0.18 }, 12: { x: 0.50, y: 0.18 }, 23: { x: 0.41, y: 0.42 }, 24: { x: 0.49, y: 0.42 } },
        person2: { 11: { x: 0.28, y: 0.22 }, 12: { x: 0.37, y: 0.22 }, 23: { x: 0.29, y: 0.46 }, 24: { x: 0.36, y: 0.46 } },
        person3: { 11: { x: 0.52, y: 0.20 }, 12: { x: 0.62, y: 0.20 }, 23: { x: 0.53, y: 0.44 }, 24: { x: 0.61, y: 0.44 } },
        person4: { 11: { x: 0.18, y: 0.30 }, 12: { x: 0.26, y: 0.30 }, 23: { x: 0.19, y: 0.52 }, 24: { x: 0.25, y: 0.52 } },
        person5: { 11: { x: 0.33, y: 0.30 }, 12: { x: 0.41, y: 0.30 }, 23: { x: 0.34, y: 0.52 }, 24: { x: 0.40, y: 0.52 } }
    }
};

// 获取某张经典照片的骨骼模板（优先用 MediaPipe 真实提取的）
function getSkeletonTemplate(skeletonId) {
    if (extractedTemplates[skeletonId]) return extractedTemplates[skeletonId];
    if (FALLBACK_TEMPLATES[skeletonId]) return FALLBACK_TEMPLATES[skeletonId];
    return null;
}

// ===== 用 MediaPipe Pose 从经典照片图片中提取真实骨骼坐标（训练） =====
let templatesTraining = false;
let templatesReady = false;

async function trainPoseTemplates() {
    if (templatesTraining || templatesReady) return;
    templatesTraining = true;

    // 需要训练的经典照片
    const classicPoses = POSES.filter(p => p.hasSkeleton && p.skeleton);
    if (classicPoses.length === 0) { templatesTraining = false; return; }

    console.log(`[训练] 开始从 ${classicPoses.length} 张经典照片提取骨骼...`);

    // 等待 MediaPipe 加载
    let PoseClass = null;
    try {
        if (typeof Pose === 'undefined') {
            // 尝试动态加载 MediaPipe
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('MediaPipe CDN 加载失败'));
                document.head.appendChild(script);
            });
        }
        PoseClass = typeof Pose !== 'undefined' ? Pose : null;
    } catch (e) {
        console.warn('[训练] MediaPipe 不可用，使用手工模板:', e.message);
        templatesTraining = false;
        return;
    }

    if (!PoseClass) { templatesTraining = false; return; }

    const pose = new PoseClass({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    // 逐个处理图片
    for (const poseData of classicPoses) {
        try {
            const landmarks = await extractLandmarksFromImage(pose, poseData.img);
            if (landmarks && landmarks.length > 0) {
                // 将多人检测结果转为模板格式
                const template = {};
                landmarks.forEach((personLandmarks, idx) => {
                    const key = `person${idx + 1}`;
                    template[key] = {};
                    personLandmarks.forEach((lm, i) => {
                        template[key][i] = { x: lm.x, y: lm.y };
                    });
                });
                extractedTemplates[poseData.skeleton] = template;
                console.log(`[训练] ✅ ${poseData.name}: 检测到 ${landmarks.length} 人`);
            }
        } catch (e) {
            console.warn(`[训练] ⚠️ ${poseData.name}:`, e.message);
        }
    }

    // 关闭 MediaPipe
    try { pose.close(); } catch (e) { /* ignore */ }
    templatesTraining = false;
    templatesReady = Object.keys(extractedTemplates).length > 0;
    console.log(`[训练] 完成，成功提取 ${Object.keys(extractedTemplates).length}/${classicPoses.length} 组骨骼`);
}

// 从单张图片提取所有人物的骨骼坐标
function extractLandmarksFromImage(poseInstance, imgSrc) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            // 创建离屏 canvas
            const offCanvas = document.createElement('canvas');
            offCanvas.width = img.naturalWidth;
            offCanvas.height = img.naturalHeight;
            const offCtx = offCanvas.getContext('2d');
            if (!offCtx) { reject(new Error('Canvas 不可用')); return; }
            offCtx.drawImage(img, 0, 0);

            let resolved = false;
            poseInstance.onResults((results) => {
                if (resolved) return;
                resolved = true;
                if (results.poseLandmarks && results.poseLandmarks.length > 0) {
                    resolve(results.poseLandmarks);
                } else {
                    reject(new Error('未检测到人物'));
                }
            });

            // 超时保护
            setTimeout(() => {
                if (!resolved) { resolved = true; reject(new Error('检测超时')); }
            }, 8000);

            poseInstance.send({ image: offCanvas }).catch(e => {
                if (!resolved) { resolved = true; reject(e); }
            });
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = imgSrc;
    });
}

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
    const video = document.getElementById('mediapipe-video');
    const canvas = document.getElementById('mediapipe-canvas');
    const statusBar = document.getElementById('pose-match-status');
    const thumb = document.getElementById('pose-thumbnail');

    // 更新右下角缩略图：显示原照片 + 名字
    if (thumb) {
        thumb.innerHTML = `
            <img src="${pose.img || ''}" alt="${pose.name}" onerror="this.style.display='none';this.nextElementSibling.style.height='100%';">
            <span class="thumb-label">${pose.name}</span>
        `;
    }

    // 请求摄像头（移动端优先后置摄像头，前置作为备选）
    try {
        // 先尝试后置摄像头（大多数毕业照场景用后置）
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        }).catch(() => {
            // 降级：尝试前置摄像头
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

        // 视频就绪后设置画布尺寸
        if (video) {
            video.addEventListener('loadedmetadata', () => {
                if (canvas) {
                    canvas.width = video.videoWidth || 640;
                    canvas.height = video.videoHeight || 480;
                }
                if (statusBar) statusBar.textContent = '准备就绪，将身体对齐参考线框';
            });
        }

        // 尝试加载 MediaPipe
        await loadMediaPipe();
    } catch (err) {
        console.warn('摄像头访问失败:', err.message);
        if (statusBar) statusBar.textContent = '摄像头权限被拒绝';
        // 显示权限提示
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
    const video = document.getElementById('mediapipe-video');
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
    const canvas = document.getElementById('mediapipe-canvas');
    if (!canvas || !canvasCtx) return;

    // 同步 canvas CSS 尺寸到视频渲染尺寸
    syncCanvasSize(canvas);

    if (!showSkeleton) {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

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

// ===== 同步 canvas CSS 尺寸到视频渲染尺寸 =====
function syncCanvasSize(canvas) {
    const video = document.getElementById('mediapipe-video');
    if (!video || !canvas) return;
    const rect = video.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
    }
}

// 绘制参考骨骼线框（绘制模板中所有人的骨骼，不同颜色区分）
function drawReferenceSkeleton(ctx, w, h) {
    if (!currentPose?.skeleton) return;
    const template = getSkeletonTemplate(currentPose.skeleton);
    if (!template) return;

    const personColors = [
        'rgba(255, 255, 255, 0.9)',   // 白色为主
        'rgba(255, 220, 100, 0.85)',  // 金色
        'rgba(100, 200, 255, 0.85)',  // 天蓝
        'rgba(255, 150, 150, 0.85)',  // 粉红
        'rgba(150, 255, 150, 0.85)',  // 绿色
    ];

    const personKeys = Object.keys(template);
    personKeys.forEach((personKey, personIdx) => {
        const keypoints = template[personKey];
        const color = personColors[personIdx % personColors.length];

        // 外发光（粗线）
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 7;

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

        // 内层线
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
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

        // 关节点（外层阴影 + 内层填充）
        Object.values(keypoints).forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, 8, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, 6, 0, 2 * Math.PI);
            ctx.fillStyle = color.replace('0.9', '1').replace('0.85', '1');
            ctx.fill();
        });
    });
}

// 绘制用户骨骼
function drawUserSkeleton(ctx, landmarks, w, h) {
    const template = currentPose?.skeleton ? getSkeletonTemplate(currentPose.skeleton) : null;

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
        if (pt.visibility > 0.5 && template?.[Object.keys(template)[0]]?.[i]) {
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
}

// ===== 匹配度计算 =====
function calculateMatchScore(landmarks) {
    if (!currentPose?.skeleton) return 1;
    const template = getSkeletonTemplate(currentPose.skeleton);
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
    const statusBar = document.getElementById('pose-match-status');
    if (!statusBar) return;

    if (score < MATCH_THRESHOLD) {
        statusBar.textContent = '✅ 完美对齐！';
        statusBar.className = 'matched';
    } else if (score < MATCH_THRESHOLD * 1.5) {
        statusBar.textContent = '接近了！再微调一下';
        statusBar.className = 'close';
    } else {
        statusBar.textContent = '将身体对齐参考线框';
        statusBar.className = '';
    }
}

// ===== 简化渲染模式（MediaPipe 不可用时） =====
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

        // 同步 canvas CSS 尺寸
        syncCanvasSize(canvas);

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        if (showSkeleton) {
            // 绘制参考骨骼线框
            drawReferenceSkeleton(canvasCtx, canvas.width, canvas.height);

            // 绘制虚线辅助框
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            canvasCtx.lineWidth = 2;
            canvasCtx.setLineDash([10, 8]);
            canvasCtx.strokeRect(
                canvas.width * 0.2, canvas.height * 0.1,
                canvas.width * 0.6, canvas.height * 0.75
            );
            canvasCtx.setLineDash([]);
        }

        animationFrameId = requestAnimationFrame(render);
    }
    render();
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
    // 注意：不在此处关闭 modal，由 closeMediaPipe() 统一处理
}

// ===== 切换骨骼显示 =====
let showSkeleton = true;
function toggleSkeleton() {
    showSkeleton = !showSkeleton;
    const canvas = document.getElementById('mediapipe-canvas');
    if (canvas) canvas.style.display = showSkeleton ? '' : 'none';
    const btn = document.getElementById('btn-toggle-skeleton');
    if (btn) btn.textContent = showSkeleton ? '👁️' : '👁️‍🗨️';
}