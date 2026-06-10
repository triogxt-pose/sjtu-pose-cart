// ============================================================
// ===== MediaPipe 实时骨骼检测 + 姿势匹配引导系统 v2.0 =====
// ============================================================
// 功能：
//   1. 实时检测摄像头画面中的人体骨骼（支持多人）
//   2. 不同人物用不同颜色的骨架和轮廓框标记
//   3. 显示经典照片的参考骨架线框作为姿势引导
//   4. 计算实时匹配度，给出视觉引导提示
//   5. 支持拍照保存（含骨架叠加层）
// ============================================================

(function () {
    'use strict';

    // ============ 全局状态 ============
    let cameraStream = null;
    let animationFrameId = null;
    let currentPose = null;
    let canvasCtx = null;
    let showSkeleton = true;
    let poseLandmarkerVideo = null;  // VIDEO 模式专用实例
    let poseLandmarkerImage = null;  // IMAGE 模式专用实例（从图片提取骨骼）
    let videoLandmarkerReady = false;
    let lastDetectionTime = 0;
    let extractedTemplates = {};  // 从图片真实提取的骨骼模板

    // ============ 骨骼连接关系（33 个关键点完整骨架） ============
    const SKELETON_CONNECTIONS = [
        // 面部轮廓
        [0, 1], [1, 2], [2, 3], [3, 7],
        [0, 4], [4, 5], [5, 6], [6, 8],
        [9, 10],
        // 躯干
        [11, 12], [11, 23], [12, 24], [23, 24],
        // 左臂
        [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19], [19, 21],
        // 右臂
        [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20], [20, 22],
        // 左腿
        [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
        // 右腿
        [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
    ];

    // ============ 多人配色方案（不同人物不同颜色） ============
    const PERSON_COLOR_PALETTE = [
        {
            name: '荧光白',
            stroke: 'rgba(255, 255, 255, 0.95)',
            glow: 'rgba(255, 255, 255, 0.4)',
            joint: 'rgba(255, 255, 255, 1)',
            box: 'rgba(255, 255, 255, 0.85)',
            fill: 'rgba(255, 255, 255, 0.08)'
        },
        {
            name: '活力金',
            stroke: 'rgba(255, 210, 80, 0.95)',
            glow: 'rgba(255, 210, 80, 0.4)',
            joint: 'rgba(255, 230, 120, 1)',
            box: 'rgba(255, 210, 80, 0.85)',
            fill: 'rgba(255, 210, 80, 0.08)'
        },
        {
            name: '天空蓝',
            stroke: 'rgba(80, 200, 255, 0.95)',
            glow: 'rgba(80, 200, 255, 0.4)',
            joint: 'rgba(120, 220, 255, 1)',
            box: 'rgba(80, 200, 255, 0.85)',
            fill: 'rgba(80, 200, 255, 0.08)'
        },
        {
            name: '珊瑚红',
            stroke: 'rgba(255, 120, 120, 0.95)',
            glow: 'rgba(255, 120, 120, 0.4)',
            joint: 'rgba(255, 140, 140, 1)',
            box: 'rgba(255, 120, 120, 0.85)',
            fill: 'rgba(255, 120, 120, 0.08)'
        },
        {
            name: '薄荷绿',
            stroke: 'rgba(120, 255, 180, 0.95)',
            glow: 'rgba(120, 255, 180, 0.4)',
            joint: 'rgba(150, 255, 200, 1)',
            box: 'rgba(120, 255, 180, 0.85)',
            fill: 'rgba(120, 255, 180, 0.08)'
        },
        {
            name: '少女粉',
            stroke: 'rgba(255, 160, 220, 0.95)',
            glow: 'rgba(255, 160, 220, 0.4)',
            joint: 'rgba(255, 180, 230, 1)',
            box: 'rgba(255, 160, 220, 0.85)',
            fill: 'rgba(255, 160, 220, 0.08)'
        },
        {
            name: '薰衣草紫',
            stroke: 'rgba(200, 160, 255, 0.95)',
            glow: 'rgba(200, 160, 255, 0.4)',
            joint: 'rgba(220, 180, 255, 1)',
            box: 'rgba(200, 160, 255, 0.85)',
            fill: 'rgba(200, 160, 255, 0.08)'
        },
        {
            name: '活力橙',
            stroke: 'rgba(255, 170, 80, 0.95)',
            glow: 'rgba(255, 170, 80, 0.4)',
            joint: 'rgba(255, 190, 120, 1)',
            box: 'rgba(255, 170, 80, 0.85)',
            fill: 'rgba(255, 170, 80, 0.08)'
        }
    ];

    // 用户检测时的颜色（实时检测到的人物用不同颜色）
    const USER_COLORS = [
        { stroke: 'rgba(0, 160, 255, 0.9)', glow: 'rgba(0, 160, 255, 0.4)', joint: 'rgba(100, 200, 255, 1)', box: 'rgba(0, 160, 255, 0.9)', outline: 'rgba(0, 100, 200, 0.6)' },
        { stroke: 'rgba(255, 100, 255, 0.9)', glow: 'rgba(255, 100, 255, 0.4)', joint: 'rgba(255, 150, 255, 1)', box: 'rgba(255, 100, 255, 0.9)', outline: 'rgba(200, 50, 200, 0.6)' },
        { stroke: 'rgba(100, 255, 200, 0.9)', glow: 'rgba(100, 255, 200, 0.4)', joint: 'rgba(150, 255, 220, 1)', box: 'rgba(100, 255, 200, 0.9)', outline: 'rgba(50, 200, 150, 0.6)' },
        { stroke: 'rgba(255, 220, 100, 0.9)', glow: 'rgba(255, 220, 100, 0.4)', joint: 'rgba(255, 235, 150, 1)', box: 'rgba(255, 220, 100, 0.9)', outline: 'rgba(200, 170, 50, 0.6)' },
        { stroke: 'rgba(255, 150, 100, 0.9)', glow: 'rgba(255, 150, 100, 0.4)', joint: 'rgba(255, 180, 140, 1)', box: 'rgba(255, 150, 100, 0.9)', outline: 'rgba(200, 100, 50, 0.6)' }
    ];

    // 主要关节点（用于更大的绘制和匹配度计算）
    const MAJOR_LANDMARKS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

    // 匹配度阈值
    const MATCH_THRESHOLD = 0.15;  // 小于此值 = 完美匹配
    const GOOD_THRESHOLD = 0.25;    // 小于此值 = 接近匹配

    // ============ 手工占位模板（当 MediaPipe 提取失败时使用） ============
    const FALLBACK_TEMPLATES = {
        classic_1_empresses: { person1: buildStandingPose(0.50, 0.50, 0.28, 0.75) },
        classic_2_wujing_xienan: {
            person1: buildStandingPose(0.40, 0.50, 0.22, 0.75),
            person2: buildStandingPose(0.60, 0.50, 0.22, 0.75)
        },
        classic_3_look_back: {
            person1: buildStandingPose(0.30, 0.50, 0.20, 0.72),
            person2: buildStandingPose(0.50, 0.50, 0.20, 0.72),
            person3: buildStandingPose(0.70, 0.50, 0.20, 0.72)
        },
        classic_3_exo: {
            person1: buildStandingPose(0.50, 0.50, 0.22, 0.75),
            person2: buildStandingPose(0.32, 0.52, 0.18, 0.70),
            person3: buildStandingPose(0.68, 0.52, 0.18, 0.70)
        },
        classic_4_trump: {
            person1: buildStandingPose(0.22, 0.50, 0.18, 0.70),
            person2: buildStandingPose(0.40, 0.50, 0.18, 0.70),
            person3: buildStandingPose(0.58, 0.50, 0.18, 0.70),
            person4: buildStandingPose(0.76, 0.50, 0.18, 0.70)
        },
        classic_4_empresses: {
            person1: buildStandingPose(0.42, 0.50, 0.20, 0.72),
            person2: buildStandingPose(0.58, 0.50, 0.20, 0.72),
            person3: buildStandingPose(0.30, 0.55, 0.18, 0.68),
            person4: buildStandingPose(0.70, 0.55, 0.18, 0.68)
        },
        classic_7_pro_team: {
            person1: buildStandingPose(0.50, 0.50, 0.20, 0.70),
            person2: buildStandingPose(0.32, 0.52, 0.17, 0.68),
            person3: buildStandingPose(0.68, 0.52, 0.17, 0.68),
            person4: buildStandingPose(0.18, 0.55, 0.15, 0.65),
            person5: buildStandingPose(0.82, 0.55, 0.15, 0.65)
        }
    };

    // 构建一个标准站姿的 33 个关键点坐标
    function buildStandingPose(centerX, centerY, bodyWidth, bodyHeight) {
        const x = centerX;
        const yTop = centerY - bodyHeight / 2;
        const yBottom = centerY + bodyHeight / 2;
        const w = bodyWidth;

        const pts = {};
        // 头部（关键点 0-10）
        pts[0] = { x: x, y: yTop, visibility: 1 };  // 鼻
        pts[1] = { x: x - w * 0.15, y: yTop + bodyHeight * 0.03, visibility: 1 };   // 左眼内侧
        pts[2] = { x: x - w * 0.25, y: yTop + bodyHeight * 0.02, visibility: 1 };   // 左眼
        pts[3] = { x: x - w * 0.35, y: yTop + bodyHeight * 0.03, visibility: 1 };   // 左眼外侧
        pts[4] = { x: x + w * 0.15, y: yTop + bodyHeight * 0.03, visibility: 1 };   // 右眼内侧
        pts[5] = { x: x + w * 0.25, y: yTop + bodyHeight * 0.02, visibility: 1 };   // 右眼
        pts[6] = { x: x + w * 0.35, y: yTop + bodyHeight * 0.03, visibility: 1 };   // 右眼外侧
        pts[7] = { x: x - w * 0.20, y: yTop + bodyHeight * 0.12, visibility: 1 };   // 左耳
        pts[8] = { x: x + w * 0.20, y: yTop + bodyHeight * 0.12, visibility: 1 };   // 右耳
        pts[9] = { x: x - w * 0.10, y: yTop + bodyHeight * 0.15, visibility: 1 };   // 左嘴角
        pts[10] = { x: x + w * 0.10, y: yTop + bodyHeight * 0.15, visibility: 1 };  // 右嘴角

        // 肩部（11-12）
        pts[11] = { x: x - w * 0.5, y: yTop + bodyHeight * 0.20, visibility: 1 };  // 左肩
        pts[12] = { x: x + w * 0.5, y: yTop + bodyHeight * 0.20, visibility: 1 };  // 右肩

        // 肘部（13-14）
        pts[13] = { x: x - w * 0.75, y: yTop + bodyHeight * 0.35, visibility: 1 }; // 左肘
        pts[14] = { x: x + w * 0.75, y: yTop + bodyHeight * 0.35, visibility: 1 }; // 右肘

        // 手腕（15-16）
        pts[15] = { x: x - w * 0.90, y: yTop + bodyHeight * 0.50, visibility: 1 }; // 左腕
        pts[16] = { x: x + w * 0.90, y: yTop + bodyHeight * 0.50, visibility: 1 }; // 右腕

        // 手指（17-22）
        pts[17] = { x: x - w * 0.95, y: yTop + bodyHeight * 0.48, visibility: 0.5 }; // 左拇指
        pts[18] = { x: x + w * 0.95, y: yTop + bodyHeight * 0.48, visibility: 0.5 }; // 右拇指
        pts[19] = { x: x - w * 1.00, y: yTop + bodyHeight * 0.52, visibility: 0.5 }; // 左小指
        pts[20] = { x: x + w * 1.00, y: yTop + bodyHeight * 0.52, visibility: 0.5 }; // 右小指
        pts[21] = { x: x - w * 0.98, y: yTop + bodyHeight * 0.55, visibility: 0.5 }; // 左食指
        pts[22] = { x: x + w * 0.98, y: yTop + bodyHeight * 0.55, visibility: 0.5 }; // 右食指

        // 髋部（23-24）
        pts[23] = { x: x - w * 0.30, y: yTop + bodyHeight * 0.52, visibility: 1 }; // 左髋
        pts[24] = { x: x + w * 0.30, y: yTop + bodyHeight * 0.52, visibility: 1 }; // 右髋

        // 膝部（25-26）
        pts[25] = { x: x - w * 0.35, y: yTop + bodyHeight * 0.72, visibility: 1 }; // 左膝
        pts[26] = { x: x + w * 0.35, y: yTop + bodyHeight * 0.72, visibility: 1 }; // 右膝

        // 脚踝（27-28）
        pts[27] = { x: x - w * 0.40, y: yBottom, visibility: 1 }; // 左踝
        pts[28] = { x: x + w * 0.40, y: yBottom, visibility: 1 }; // 右踝

        // 脚趾（29-32）
        pts[29] = { x: x - w * 0.45, y: yBottom + bodyHeight * 0.02, visibility: 0.5 };
        pts[30] = { x: x + w * 0.45, y: yBottom + bodyHeight * 0.02, visibility: 0.5 };
        pts[31] = { x: x - w * 0.35, y: yBottom + bodyHeight * 0.03, visibility: 0.5 };
        pts[32] = { x: x + w * 0.35, y: yBottom + bodyHeight * 0.03, visibility: 0.5 };

        return pts;
    }

    // ============ 获取骨骼模板 ============
    function getSkeletonTemplate(skeletonId) {
        if (!skeletonId) return null;
        if (extractedTemplates[skeletonId]) return extractedTemplates[skeletonId];
        if (FALLBACK_TEMPLATES[skeletonId]) return FALLBACK_TEMPLATES[skeletonId];
        return null;
    }

    // ============ MediaPipe 初始化（VIDEO 模式） ============
    async function initPoseLandmarkerVideo() {
        if (poseLandmarkerVideo) return poseLandmarkerVideo;

        // 等待 vision_bundle.js 加载完成
        if (typeof window === 'undefined' || !window.PoseLandmarker || !window.FilesetResolver) {
            console.warn('[MediaPipe] Tasks Vision 库尚未加载，等待中...');
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!window.PoseLandmarker || !window.FilesetResolver) {
                console.error('[MediaPipe] Tasks Vision 库加载失败');
                return null;
            }
        }

        try {
            const vision = await window.FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
            );

            poseLandmarkerVideo = await window.PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
                    delegate: 'GPU'
                },
                runningMode: 'VIDEO',
                numPoses: 6,
                minPoseDetectionConfidence: 0.5,
                minPosePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            videoLandmarkerReady = true;
            console.log('[MediaPipe] VIDEO 模式 PoseLandmarker 初始化成功');
            return poseLandmarkerVideo;
        } catch (e) {
            console.error('[MediaPipe] VIDEO 模式初始化失败:', e.message);
            return null;
        }
    }

    // ============ MediaPipe 初始化（IMAGE 模式 - 从图片提取骨骼） ============
    async function initPoseLandmarkerImage() {
        if (poseLandmarkerImage) return poseLandmarkerImage;

        if (typeof window === 'undefined' || !window.PoseLandmarker || !window.FilesetResolver) {
            console.warn('[MediaPipe] Tasks Vision 库尚未加载');
            return null;
        }

        try {
            const vision = await window.FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
            );

            poseLandmarkerImage = await window.PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
                    delegate: 'GPU'
                },
                runningMode: 'IMAGE',
                numPoses: 8,
                minPoseDetectionConfidence: 0.4
            });

            console.log('[MediaPipe] IMAGE 模式 PoseLandmarker 初始化成功');
            return poseLandmarkerImage;
        } catch (e) {
            console.error('[MediaPipe] IMAGE 模式初始化失败:', e.message);
            return null;
        }
    }

    // ============ 从经典照片提取真实骨骼（可选训练步骤） ============
    async function trainPoseTemplates() {
        if (Object.keys(extractedTemplates).length > 0) return;

        const landmarker = await initPoseLandmarkerImage();
        if (!landmarker) {
            console.log('[训练] IMAGE 模式不可用，使用降级模板');
            return;
        }

        // 如果全局有 POSES 数据，尝试从中提取
        if (typeof window.POSES !== 'undefined') {
            const classicPoses = window.POSES.filter(p => p.hasSkeleton && p.skeleton && p.img);
            console.log(`[训练] 尝试从 ${classicPoses.length} 张经典照片提取骨骼...`);

            for (const poseData of classicPoses) {
                try {
                    const img = await loadImage(poseData.img);
                    if (!img) continue;
                    const results = landmarker.detect(img);
                    if (results && results.landmarks && results.landmarks.length > 0) {
                        const template = {};
                        results.landmarks.forEach((personLandmarks, idx) => {
                            const key = `person${idx + 1}`;
                            template[key] = {};
                            personLandmarks.forEach((lm, i) => {
                                template[key][i] = {
                                    x: lm.x,
                                    y: lm.y,
                                    z: lm.z || 0,
                                    visibility: (typeof lm.visibility === 'number') ? lm.visibility : 1
                                };
                            });
                        });
                        extractedTemplates[poseData.skeleton] = template;
                        console.log(`[训练] ✅ ${poseData.name}: 检测到 ${results.landmarks.length} 人`);
                    }
                } catch (e) {
                    // 单张图片失败不影响其他
                }
            }
        }
    }

    function loadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    // ============ 启动摄像头 + 实时检测 ============
    async function initMediaPipeCamera(pose) {
        currentPose = pose;

        const video = document.getElementById('mediapipe-video');
        const canvas = document.getElementById('mediapipe-canvas');
        const statusBar = document.getElementById('pose-match-status');
        const thumb = document.getElementById('pose-thumbnail');

        // 更新缩略图
        if (thumb && pose) {
            thumb.innerHTML = `
                <img src="${pose.img || ''}" alt="${pose.name}" onerror="this.style.display='none'">
                <span class="thumb-label">${pose.name}</span>
            `;
        }

        // 请求摄像头权限
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: 'user' },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });
            } else {
                throw new Error('浏览器不支持 getUserMedia');
            }
        } catch (err) {
            console.error('[MediaPipe] 摄像头访问失败:', err);
            if (statusBar) statusBar.textContent = '📷 需要摄像头权限';
            const infoEl = document.querySelector('.mediapipe-info');
            if (infoEl) {
                infoEl.innerHTML = `
                    <p style="color:#ff6b6b;font-weight:600;">📷 无法访问摄像头</p>
                    <p style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:6px;">
                        请在浏览器设置中允许摄像头访问<br>然后刷新页面重试
                    </p>
                    <button class="btn-primary" onclick="closeMediaPipe()" style="margin-top:12px;font-size:13px;padding:10px 24px;">← 返回</button>
                `;
            }
            return;
        }

        // 绑定视频流
        if (video) {
            video.srcObject = cameraStream;
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.muted = true;

            // 等待视频元数据加载
            await new Promise((resolve) => {
                if (video.readyState >= 1) { resolve(); return; }
                video.addEventListener('loadedmetadata', resolve, { once: true });
                setTimeout(resolve, 5000);
            });

            // 启动播放
            try {
                await video.play();
            } catch (e) {
                console.warn('视频自动播放被阻止');
            }
        }

        // 初始化 canvas
        if (canvas && video) {
            canvasCtx = canvas.getContext('2d');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
        }

        // 显示加载状态
        if (statusBar) statusBar.textContent = '🔄 正在加载骨骼检测模型...';

        // 初始化 PoseLandmarker（VIDEO 模式）
        const landmarker = await initPoseLandmarkerVideo();

        if (!landmarker) {
            console.warn('[MediaPipe] 使用降级渲染模式');
            if (statusBar) statusBar.textContent = '⚠️ 骨骼检测不可用（仅显示参考线框）';
            startFallbackRender();
            return;
        }

        if (statusBar) statusBar.textContent = '🎯 准备就绪 - 将身体对齐参考线框';
        startRealtimeDetection(landmarker);
    }

    // ============ 实时检测循环（主循环） ============
    function startRealtimeDetection(landmarker) {
        const video = document.getElementById('mediapipe-video');
        const canvas = document.getElementById('mediapipe-canvas');
        if (!video || !canvas || !canvasCtx) return;

        let lastFrameTime = performance.now();

        async function detectLoop(now) {
            if (!cameraStream) return;

            // 限制检测频率（约 30 FPS），避免过度消耗性能
            const shouldDetect = (now - lastDetectionTime) >= 33;

            let detectionResults = null;
            if (shouldDetect && video.readyState >= 2) {
                try {
                    detectionResults = landmarker.detectForVideo(video, now);
                    lastDetectionTime = now;
                } catch (e) {
                    // 检测出错时继续循环
                }
            }

            // 同步 canvas 尺寸
            if (video.videoWidth && video.videoHeight) {
                if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
                if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
            }
            syncCanvasSize(canvas);

            // 清空画布
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            if (showSkeleton) {
                // 1) 绘制参考骨骼线框（从经典照片来的姿势）
                drawReferenceSkeletons(canvasCtx, canvas.width, canvas.height);

                // 2) 绘制用户实时骨骼（带颜色区分 + 轮廓框）
                if (detectionResults && detectionResults.landmarks && detectionResults.landmarks.length > 0) {
                    drawUserSkeletonsWithOutline(canvasCtx, detectionResults.landmarks, canvas.width, canvas.height);

                    // 3) 计算匹配度并更新状态
                    const matchScore = calculateMatchScore(detectionResults.landmarks);
                    updateMatchStatus(matchScore);

                    // 4) 绘制匹配方向引导箭头
                    drawMatchGuidance(canvasCtx, detectionResults.landmarks, canvas.width, canvas.height);
                } else {
                    // 未检测到人物
                    updateMatchStatus(null);
                }
            }

            animationFrameId = requestAnimationFrame(detectLoop);
        }

        animationFrameId = requestAnimationFrame(detectLoop);
    }

    // ============ 降级渲染模式（MediaPipe 不可用时） ============
    function startFallbackRender() {
        const video = document.getElementById('mediapipe-video');
        const canvas = document.getElementById('mediapipe-canvas');
        if (!canvas || !canvasCtx) return;

        function render() {
            if (!cameraStream) return;
            if (video && video.videoWidth) {
                if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
                if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
            }
            syncCanvasSize(canvas);
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            if (showSkeleton) {
                drawReferenceSkeletons(canvasCtx, canvas.width, canvas.height);
            }
            animationFrameId = requestAnimationFrame(render);
        }
        render();
    }

    // ============ 同步 canvas 显示尺寸 ============
    function syncCanvasSize(canvas) {
        const video = document.getElementById('mediapipe-video');
        if (!video || !canvas) return;
        const rect = video.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
        }
    }

    // ============ 绘制参考骨骼（多人 + 不同颜色 + 轮廓框） ============
    function drawReferenceSkeletons(ctx, w, h) {
        if (!currentPose || !currentPose.skeleton) return;
        const template = getSkeletonTemplate(currentPose.skeleton);
        if (!template) return;

        const personKeys = Object.keys(template);
        personKeys.forEach((personKey, personIdx) => {
            const keypoints = template[personKey];
            const colors = PERSON_COLOR_PALETTE[personIdx % PERSON_COLOR_PALETTE.length];

            // === 1. 绘制人物轮廓框（参考姿势的整体范围） ===
            drawPersonBoundingBox(ctx, keypoints, w, h, colors, personIdx + 1);

            // === 2. 绘制骨架连接线（多层渲染实现发光效果） ===
            // 外层黑色描边 - 增强对比
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.lineWidth = 9;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            drawSkeletonConnections(ctx, keypoints, w, h, 0.3);

            // 中层彩色主线
            ctx.strokeStyle = colors.stroke;
            ctx.lineWidth = 5;
            drawSkeletonConnections(ctx, keypoints, w, h, 0.3);

            // 内层发光效果
            ctx.shadowColor = colors.glow;
            ctx.shadowBlur = 15;
            ctx.strokeStyle = colors.stroke;
            ctx.lineWidth = 2;
            drawSkeletonConnections(ctx, keypoints, w, h, 0.3);
            ctx.shadowBlur = 0;

            // === 3. 绘制关节点 ===
            drawJoints(ctx, keypoints, w, h, colors);
        });
    }

    // ============ 绘制用户实时骨骼（多人 + 不同颜色 + 轮廓框） ============
    function drawUserSkeletonsWithOutline(ctx, landmarksArray, w, h) {
        if (!landmarksArray || landmarksArray.length === 0) return;

        landmarksArray.forEach((landmarks, personIdx) => {
            const colors = USER_COLORS[personIdx % USER_COLORS.length];

            // 转换 landmarks 为统一格式（带 visibility 字段）
            const keypoints = {};
            landmarks.forEach((lm, i) => {
                keypoints[i] = {
                    x: lm.x,
                    y: lm.y,
                    z: lm.z || 0,
                    visibility: (typeof lm.visibility === 'number') ? lm.visibility : 1
                };
            });

            // === 1. 绘制人物轮廓框（带半透明填充） ===
            drawPersonBoundingBox(ctx, keypoints, w, h, colors, personIdx + 1, true);

            // === 2. 绘制骨架连接线 ===
            // 外层深色描边
            ctx.strokeStyle = colors.outline || 'rgba(0, 0, 0, 0.6)';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            drawSkeletonConnections(ctx, keypoints, w, h, 0.5);

            // 中层彩色主线
            ctx.shadowColor = colors.glow;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = colors.stroke;
            ctx.lineWidth = 3;
            drawSkeletonConnections(ctx, keypoints, w, h, 0.5);
            ctx.shadowBlur = 0;

            // === 3. 绘制关节点 ===
            drawUserJoints(ctx, keypoints, w, h, colors);
        });
    }

    // ============ 绘制人物轮廓框（Bounding Box） ============
    function drawPersonBoundingBox(ctx, keypoints, w, h, colors, personNumber, isUser) {
        // 计算人物边界
        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        let foundAny = false;

        for (let i = 0; i < 33; i++) {
            const pt = keypoints[i];
            if (!pt || (pt.visibility ?? 1) < 0.3) continue;
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.y > maxY) maxY = pt.y;
            foundAny = true;
        }

        if (!foundAny) return;

        // 扩展边界框（给身体周围留一点空间）
        const paddingX = (maxX - minX) * 0.25;
        const paddingYTop = (maxY - minY) * 0.15;
        const paddingYBottom = (maxY - minY) * 0.08;

        const boxX = Math.max(0, minX - paddingX) * w;
        const boxY = Math.max(0, minY - paddingYTop) * h;
        const boxW = Math.min(w, (maxX + paddingX) * w) - boxX;
        const boxH = Math.min(h, (maxY + paddingYBottom) * h) - boxY;

        if (boxW < 10 || boxH < 10) return;

        // 绘制半透明填充（用户人物更明显）
        if (isUser) {
            ctx.fillStyle = colors.fill || 'rgba(0, 160, 255, 0.06)';
            ctx.fillRect(boxX, boxY, boxW, boxH);
        }

        // 绘制边框
        ctx.strokeStyle = colors.box;
        ctx.lineWidth = isUser ? 3 : 2;
        ctx.setLineDash(isUser ? [] : [8, 6]);

        if (!isUser) {
            // 参考姿势 - 虚线框 + 发光效果
            ctx.shadowColor = colors.glow;
            ctx.shadowBlur = 8;
        }

        ctx.strokeRect(boxX, boxY, boxW, boxH);
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);

        // 人物编号标签
        ctx.font = 'bold 14px sans-serif';
        const labelText = isUser ? `人物 ${personNumber}` : `参考 ${personNumber}`;
        const labelWidth = ctx.measureText(labelText).width + 16;

        // 标签背景
        ctx.fillStyle = colors.box;
        ctx.fillRect(boxX, boxY - 22, labelWidth, 22);

        // 标签文字
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, boxX + 8, boxY - 11);
    }

    // ============ 绘制骨架连接线 ============
    function drawSkeletonConnections(ctx, keypoints, w, h, minVisibility) {
        SKELETON_CONNECTIONS.forEach(([from, to]) => {
            const p1 = keypoints[from];
            const p2 = keypoints[to];
            if (!p1 || !p2) return;
            if ((p1.visibility ?? 1) < minVisibility || (p2.visibility ?? 1) < minVisibility) return;

            ctx.beginPath();
            ctx.moveTo(p1.x * w, p1.y * h);
            ctx.lineTo(p2.x * w, p2.y * h);
            ctx.stroke();
        });
    }

    // ============ 绘制关节点（参考姿势） ============
    function drawJoints(ctx, keypoints, w, h, colors) {
        for (let i = 0; i < 33; i++) {
            const pt = keypoints[i];
            if (!pt || (pt.visibility ?? 1) < 0.3) continue;

            const isMajor = MAJOR_LANDMARKS.includes(i);
            const r = isMajor ? 7 : 4;

            // 外层深色描边
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, r + 2, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fill();

            // 内层主色
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, r, 0, 2 * Math.PI);
            ctx.fillStyle = colors.joint;
            ctx.fill();

            // 主要关节点添加白色高光
            if (isMajor) {
                ctx.beginPath();
                ctx.arc(pt.x * w - 1, pt.y * h - 1, Math.max(2, r * 0.35), 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fill();
            }
        }
    }

    // ============ 绘制用户关节点 ============
    function drawUserJoints(ctx, keypoints, w, h, colors) {
        for (let i = 0; i < 33; i++) {
            const pt = keypoints[i];
            if (!pt || pt.visibility < 0.5) continue;

            const isMajor = MAJOR_LANDMARKS.includes(i);
            const r = isMajor ? 6 : 3;

            // 外层深色描边
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, r + 2, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fill();

            // 内层主色
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, r, 0, 2 * Math.PI);
            ctx.fillStyle = colors.joint;
            ctx.fill();

            if (isMajor) {
                ctx.beginPath();
                ctx.arc(pt.x * w - 1, pt.y * h - 1, Math.max(1.5, r * 0.3), 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fill();
            }
        }
    }

    // ============ 计算匹配度 ============
    function calculateMatchScore(landmarksArray) {
        if (!currentPose || !currentPose.skeleton || !landmarksArray || landmarksArray.length === 0) {
            return null;
        }
        const template = getSkeletonTemplate(currentPose.skeleton);
        if (!template) return null;

        // 对于每个检测到的用户人物，找到最近的参考人物
        let totalScore = 0;
        let matchedCount = 0;

        const userLandmarks = landmarksArray[0];  // 只匹配第一个人作为主要用户

        // 将用户 landmarks 转换为统一格式
        const userKeypoints = {};
        userLandmarks.forEach((lm, i) => {
            userKeypoints[i] = {
                x: lm.x,
                y: lm.y,
                visibility: (typeof lm.visibility === 'number') ? lm.visibility : 1
            };
        });

        // 在所有参考人物中找最匹配的一个
        let bestScore = Infinity;
        const templateKeys = Object.keys(template);

        templateKeys.forEach((personKey) => {
            const refKeypoints = template[personKey];
            let dist = 0;
            let count = 0;

            MAJOR_LANDMARKS.forEach(idx => {
                const ref = refKeypoints[idx];
                const user = userKeypoints[idx];
                if (ref && user && user.visibility > 0.4) {
                    const dx = ref.x - user.x;
                    const dy = ref.y - user.y;
                    dist += Math.sqrt(dx * dx + dy * dy);
                    count++;
                }
            });

            if (count > 0) {
                const avgDist = dist / count;
                if (avgDist < bestScore) {
                    bestScore = avgDist;
                }
            }
        });

        return isFinite(bestScore) ? bestScore : null;
    }

    // ============ 绘制匹配引导箭头（告诉用户该往哪移动） ============
    function drawMatchGuidance(ctx, landmarksArray, w, h) {
        if (!currentPose || !currentPose.skeleton) return;
        const template = getSkeletonTemplate(currentPose.skeleton);
        if (!template) return;

        const userLandmarks = landmarksArray[0];
        if (!userLandmarks) return;

        // 找第一个参考人物
        const templateKeys = Object.keys(template);
        if (templateKeys.length === 0) return;

        const refKeypoints = template[templateKeys[0]];

        // 只对主要关节绘制引导（肩部、髋部、手腕、脚踝）
        const guidePoints = [
            { idx: 11, label: '左肩' },
            { idx: 12, label: '右肩' },
            { idx: 15, label: '左手' },
            { idx: 16, label: '右手' },
            { idx: 23, label: '左髋' },
            { idx: 24, label: '右髋' }
        ];

        ctx.font = 'bold 11px sans-serif';

        guidePoints.forEach(({ idx }) => {
            const ref = refKeypoints[idx];
            const userPt = userLandmarks[idx];
            if (!ref || !userPt || userPt.visibility < 0.5) return;

            const userX = userPt.x * w;
            const userY = userPt.y * h;
            const refX = ref.x * w;
            const refY = ref.y * h;

            const dx = refX - userX;
            const dy = refY - userY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 只有距离超过一定阈值才显示引导
            const threshold = Math.min(w, h) * 0.05;
            if (distance < threshold) return;

            // 绘制箭头从用户位置指向参考位置
            const arrowLen = Math.min(distance * 0.6, 40);
            const angle = Math.atan2(dy, dx);

            // 箭头起点（用户位置稍微偏离）
            const startX = userX + Math.cos(angle) * 12;
            const startY = userY + Math.sin(angle) * 12;
            const endX = startX + Math.cos(angle) * arrowLen;
            const endY = startY + Math.sin(angle) * arrowLen;

            // 绘制箭头线条
            ctx.strokeStyle = 'rgba(255, 220, 100, 0.9)';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // 绘制箭头头部
            const headLen = 10;
            const headAngle = Math.PI / 6;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLen * Math.cos(angle - headAngle),
                endY - headLen * Math.sin(angle - headAngle)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLen * Math.cos(angle + headAngle),
                endY - headLen * Math.sin(angle + headAngle)
            );
            ctx.strokeStyle = 'rgba(255, 220, 100, 1)';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 箭头圆圈
            ctx.beginPath();
            ctx.arc(endX, endY, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 220, 100, 0.9)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }

    // ============ 更新匹配状态显示 ============
    function updateMatchStatus(score) {
        const statusBar = document.getElementById('pose-match-status');
        const percentEl = document.getElementById('match-percent');
        const progressEl = document.getElementById('match-progress-fill');

        if (score === null || score === undefined) {
            if (statusBar) {
                statusBar.textContent = '👀 未检测到人物 - 请站到画面中央';
                statusBar.className = '';
            }
            if (percentEl) percentEl.textContent = '--%';
            if (progressEl) progressEl.style.width = '5%';
            return;
        }

        let text, cls, percent;

        if (score < MATCH_THRESHOLD) {
            text = '✅ 完美对齐！保持姿势，茄子！';
            cls = 'matched';
            percent = Math.max(90, 100 - Math.round((score / MATCH_THRESHOLD) * 10));
        } else if (score < GOOD_THRESHOLD) {
            text = '🟡 接近了！微调一下位置';
            cls = 'close';
            percent = Math.round((1 - (score - MATCH_THRESHOLD) / (GOOD_THRESHOLD - MATCH_THRESHOLD) * 0.3) * 80 + 20);
        } else if (score < 0.4) {
            text = '🟠 还需要调整 - 请参考箭头方向移动';
            cls = 'far';
            percent = Math.round((1 - (score - GOOD_THRESHOLD) / (0.4 - GOOD_THRESHOLD)) * 50 + 10);
        } else {
            text = '🎯 将身体对齐参考线框';
            cls = '';
            percent = Math.max(5, Math.round((1 - score / 0.6) * 30));
        }

        percent = Math.max(5, Math.min(100, percent));

        if (statusBar) {
            statusBar.textContent = text;
            statusBar.className = cls || '';
        }
        if (percentEl) percentEl.textContent = Math.round(percent) + '%';
        if (progressEl) {
            progressEl.style.width = percent + '%';
            // 根据匹配度改变进度条颜色
            if (score < MATCH_THRESHOLD) {
                progressEl.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
            } else if (score < GOOD_THRESHOLD) {
                progressEl.style.background = 'linear-gradient(90deg, #f39c12, #f1c40f)';
            } else {
                progressEl.style.background = 'linear-gradient(90deg, #3498db, #5dade2)';
            }
        }
    }

    // ============ 拍照 ============
    function capturePhoto() {
        const video = document.getElementById('mediapipe-video');
        const canvas = document.getElementById('mediapipe-canvas');
        if (!video || !canvas) return;

        // 创建合成画布
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = video.videoWidth || 1280;
        captureCanvas.height = video.videoHeight || 720;
        const ctx = captureCanvas.getContext('2d');

        // 1. 绘制视频画面
        try {
            ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
        } catch (e) {
            // 视频绘制失败时跳过
        }

        // 2. 叠加骨架图层（如果有）
        try {
            ctx.drawImage(canvas, 0, 0, captureCanvas.width, captureCanvas.height);
        } catch (e) {
            // 骨架绘制失败时跳过
        }

        // 3. 添加水印
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'right';
        ctx.fillText('交大毕业照购物车', captureCanvas.width - 15, captureCanvas.height - 15);

        // 4. 下载图片
        try {
            const link = document.createElement('a');
            link.download = `sjtu_graduation_${Date.now()}.png`;
            link.href = captureCanvas.toDataURL('image/png');
            link.click();
            showToast('📸 照片已保存！');
        } catch (e) {
            showToast('⚠️ 照片保存失败');
        }
    }

    // ============ 停止相机 ============
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

    // ============ 切换骨骼显示 ============
    function toggleSkeleton() {
        showSkeleton = !showSkeleton;
        const canvas = document.getElementById('mediapipe-canvas');
        if (canvas) canvas.style.display = showSkeleton ? '' : 'none';
        const btn = document.getElementById('btn-toggle-skeleton');
        if (btn) btn.textContent = showSkeleton ? '👁️' : '👁️‍🗨️';
    }

    // ============ 切换姿势（从 pose picker 调用） ============
    function switchTargetPose(pose) {
        currentPose = pose;
        const thumb = document.getElementById('pose-thumbnail');
        if (thumb && pose) {
            thumb.innerHTML = `
                <img src="${pose.img || ''}" alt="${pose.name}" onerror="this.style.display='none'">
                <span class="thumb-label">${pose.name}</span>
            `;
        }
        if (typeof showToast === 'function') {
            showToast(`已切换到: ${pose.name}`);
        }
    }

    // ============ 暴露到全局（供外部 JS 调用） ============
    window.initMediaPipeCamera = initMediaPipeCamera;
    window.stopCamera = stopCamera;
    window.capturePhoto = capturePhoto;
    window.toggleSkeleton = toggleSkeleton;
    window.switchTargetPose = switchTargetPose;
    window.trainPoseTemplates = trainPoseTemplates;

    // 页面加载后启动训练（不阻塞主流程）
    if (typeof document !== 'undefined') {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(trainPoseTemplates, 2000);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(trainPoseTemplates, 2000);
            });
        }
    }
})();
