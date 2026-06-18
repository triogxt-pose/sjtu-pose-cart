// ============================================================
// ===== MediaPipe 实时骨骼检测 + 姿势匹配引导系统 v3.0 =====
// ============================================================
// 重要更新：
//   - 使用 OFFLINE 骨骼模板（js/skeleton-templates.js）
//   - 不再依赖 MediaPipe 图片识别来提取参考照片骨骼
//   - 仅对用户摄像头画面进行实时骨骼检测
// ============================================================

(function () {
    'use strict';

    // ============ 全局状态 ============
    let cameraStream = null;
    let animationFrameId = null;
    let currentPose = null;
    let canvasCtx = null;
    let showSkeleton = true;
    let poseLandmarkerVideo = null;
    let videoLandmarkerReady = false;
    let lastDetectionTime = 0;

    // ============ 骨骼连接关系 ============
    const SKELETON_CONNECTIONS = [
        [0, 11], [0, 12],
        [11, 12], [11, 23], [12, 24], [23, 24],
        [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
        [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
        [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
        [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
    ];

    // ============ 多人配色方案 ============
    const PERSON_COLOR_PALETTE = [
        { main: '#00a8ff', outline: 'rgba(0,60,120,0.7)', glow: 'rgba(0,168,255,0.4)', box: 'rgba(0,168,255,0.8)' },
        { main: '#ff64ff', outline: 'rgba(120,40,120,0.7)', glow: 'rgba(255,100,255,0.4)', box: 'rgba(255,100,255,0.8)' },
        { main: '#64ffc8', outline: 'rgba(40,120,80,0.7)', glow: 'rgba(100,255,200,0.4)', box: 'rgba(100,255,200,0.8)' },
        { main: '#ffdc64', outline: 'rgba(140,110,40,0.7)', glow: 'rgba(255,220,100,0.4)', box: 'rgba(255,220,100,0.8)' },
        { main: '#ff9664', outline: 'rgba(160,80,40,0.7)', glow: 'rgba(255,150,100,0.4)', box: 'rgba(255,150,100,0.8)' },
        { main: '#ff6e6e', outline: 'rgba(160,60,60,0.7)', glow: 'rgba(255,110,110,0.4)', box: 'rgba(255,110,110,0.8)' }
    ];

    // ============ 参考骨架颜色（白色） ============
    const REFERENCE_COLORS = {
        main: 'rgba(255,255,255,0.95)',
        outline: 'rgba(0,0,0,0.7)',
        glow: 'rgba(255,255,255,0.3)',
        box: 'rgba(255,255,255,0.7)'
    };

    // ============ 获取离线骨骼模板 ============
    function getSkeletonTemplate(skeletonId) {
        if (window.SKELETON_TEMPLATES && window.SKELETON_TEMPLATES[skeletonId]) {
            return window.SKELETON_TEMPLATES[skeletonId];
        }
        return null;
    }

    // ============ 绘制单人骨架 ============
    function drawPersonSkeleton(ctx, person, offsetX, offsetY, areaW, areaH, personIdx, isReference) {
        const colors = isReference ? REFERENCE_COLORS : PERSON_COLOR_PALETTE[personIdx % PERSON_COLOR_PALETTE.length];

        let minX = 1, maxX = 0, minY = 1, maxY = 0, found = false;
        for (let i = 0; i < 33; i++) {
            const pt = person[i];
            if (pt && (pt.v !== undefined ? pt.v : 1) > 0.3) {
                if (pt.x < minX) minX = pt.x;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.y > maxY) maxY = pt.y;
                found = true;
            }
        }
        if (!found) return;

        // 边界框 + 编号
        const boxPadX = (maxX - minX) * 0.18;
        const boxPadYTop = (maxY - minY) * 0.12;
        const boxPadYBottom = (maxY - minY) * 0.05;

        const bx = offsetX + Math.max(0, minX - boxPadX) * areaW;
        const by = offsetY + Math.max(0, minY - boxPadYTop) * areaH;
        const bw2 = (Math.min(1, maxX + boxPadX) - Math.max(0, minX - boxPadX)) * areaW;
        const bh2 = (Math.min(1, maxY + boxPadYBottom) - Math.max(0, minY - boxPadYTop)) * areaH;

        ctx.save();
        ctx.strokeStyle = colors.box;
        ctx.lineWidth = 2;
        if (isReference) ctx.setLineDash([6, 5]);
        ctx.strokeRect(bx, by, bw2, bh2);
        ctx.setLineDash([]);

        const label = isReference ? `参考${personIdx + 1}` : `人物${personIdx + 1}`;
        ctx.font = 'bold 12px sans-serif';
        const labelW = ctx.measureText(label).width + 14;
        ctx.fillStyle = colors.box;
        ctx.fillRect(bx, by - 18, labelW, 18);
        ctx.fillStyle = isReference ? '#000' : 'rgba(255,255,255,0.95)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, bx + 7, by - 9);
        ctx.restore();

        // 骨架连接
        SKELETON_CONNECTIONS.forEach(([from, to]) => {
            const p1 = person[from];
            const p2 = person[to];
            if (!p1 || !p2) return;
            const v1 = (p1.v !== undefined ? p1.v : 1);
            const v2 = (p2.v !== undefined ? p2.v : 1);
            if (v1 < 0.3 || v2 < 0.3) return;

            const x1 = offsetX + p1.x * areaW;
            const y1 = offsetY + p1.y * areaH;
            const x2 = offsetX + p2.x * areaW;
            const y2 = offsetY + p2.y * areaH;

            ctx.strokeStyle = colors.outline;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.shadowColor = colors.glow;
            ctx.shadowBlur = isReference ? 6 : 12;
            ctx.strokeStyle = colors.main;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        });

        // 关节点
        for (let i = 0; i < 33; i++) {
            const pt = person[i];
            if (!pt) continue;
            const visibility = (pt.v !== undefined ? pt.v : 1);
            if (visibility < 0.3) continue;

            const x = offsetX + pt.x * areaW;
            const y = offsetY + pt.y * areaH;
            const isMajor = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(i);
            const r = isMajor ? 5 : 3;

            ctx.beginPath();
            ctx.arc(x, y, r + 2, 0, 2 * Math.PI);
            ctx.fillStyle = colors.outline;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = colors.main;
            ctx.fill();

            if (isMajor) {
                ctx.beginPath();
                ctx.arc(x - 1, y - 1, Math.max(1, r * 0.4), 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.fill();
            }
        }
    }

    // ============ 计算匹配度 ============
    function calculateMatchScore(userLandmarksArray) {
        if (!currentPose || !currentPose.skeleton || !userLandmarksArray || userLandmarksArray.length === 0) {
            return null;
        }

        const template = getSkeletonTemplate(currentPose.skeleton);
        if (!template) return null;

        const majorJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
        let bestAvgDist = Infinity;

        // 只取参考中第一个人物进行匹配（用户通常一人）
        for (let refIdx = 0; refIdx < Math.min(template.persons.length, 2); refIdx++) {
            const refP = template.persons[refIdx];
            if (!refP[11] || !refP[12]) continue;

            const refShoulderDist = Math.abs(refP[11].x - refP[12].x) || 0.15;
            const refTorsoH = Math.abs((refP[11].y + refP[12].y) / 2 - (refP[23].y + refP[24].y) / 2) || 0.15;
            const refScale = Math.max(refShoulderDist, refTorsoH);

            for (let userIdx = 0; userIdx < userLandmarksArray.length; userIdx++) {
                const user = userLandmarksArray[userIdx];
                let totalDist = 0;
                let count = 0;

                majorJoints.forEach(i => {
                    const ref = refP[i];
                    const up = user[i];
                    if (!ref || !up) return;
                    const uv = (typeof up.visibility === 'number' ? up.visibility : 1);
                    if (uv < 0.4) return;

                    const dx = (ref.x - up.x) / refScale;
                    const dy = (ref.y - up.y) / refScale;
                    totalDist += Math.sqrt(dx * dx + dy * dy);
                    count++;
                });

                if (count > 6) {
                    const avg = totalDist / count;
                    if (avg < bestAvgDist) bestAvgDist = avg;
                }
            }
        }

        return isFinite(bestAvgDist) ? bestAvgDist : null;
    }

    // ============ 绘制参考照片骨架（在主应用中） ============
    function renderReferenceSkeletonOnImage(imageCanvas, overlayCanvas) {
        if (!currentPose || !currentPose.skeleton) return;

        const template = getSkeletonTemplate(currentPose.skeleton);
        if (!template) return;

        const bw = imageCanvas.width;
        const bh = imageCanvas.height;
        overlayCanvas.width = bw;
        overlayCanvas.height = bh;
        const ctx = overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, bw, bh);

        template.persons.forEach((person, idx) => {
            drawPersonSkeleton(ctx, person, 0, 0, bw, bh, idx, true);
        });
    }

    // ============ 实时检测循环 ============
    function startDetectionLoop(videoEl, canvasEl) {
        if (!videoEl || !canvasEl) return;
        const ctx = canvasEl.getContext('2d');

        function loop(now) {
            if (!cameraStream) return;

            if (videoEl.videoWidth && videoEl.videoHeight) {
                if (canvasEl.width !== videoEl.videoWidth) {
                    canvasEl.width = videoEl.videoWidth;
                    canvasEl.height = videoEl.videoHeight;
                }
            }

            ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

            // 先绘制参考骨架（经典姿势模板，白色虚线）—— 不受 AI 加载影响
            if (currentPose && currentPose.skeleton) {
                const template = getSkeletonTemplate(currentPose.skeleton);
                if (template && template.persons) {
                    template.persons.forEach((person, idx) => {
                        drawPersonSkeleton(ctx, person, 0, 0, canvasEl.width, canvasEl.height, idx, true);
                    });
                }
            }

            // AI 模型未就绪时显示提示
            if (!videoLandmarkerReady) {
                const statusEl = document.getElementById('pose-match-status');
                if (statusEl && !statusEl._aiLoadingShown) {
                    statusEl._aiLoadingShown = true;
                    statusEl.textContent = '⏳ AI 模型加载中...（参考骨架已显示）';
                    statusEl.style.color = '#f1c40f';
                }
                animationFrameId = requestAnimationFrame(loop);
                return;
            }

            let landmarks = null;
            if (videoLandmarkerReady && poseLandmarkerVideo && videoEl.readyState >= 2 && (now - lastDetectionTime) >= 40) {
                try {
                    const result = poseLandmarkerVideo.detectForVideo(videoEl, now);
                    if (result && result.landmarks) landmarks = result.landmarks;
                    lastDetectionTime = now;
                } catch (e) { /* 跳过 */ }
            }

            if (landmarks && landmarks.length > 0) {
                landmarks.forEach((lm, idx) => {
                    const person = {};
                    lm.forEach((p, i) => {
                        person[i] = {
                            x: p.x,
                            y: p.y,
                            v: (typeof p.visibility === 'number' ? p.visibility : 1)
                        };
                    });
                    drawPersonSkeleton(ctx, person, 0, 0, canvasEl.width, canvasEl.height, idx, false);
                });

                // 更新匹配状态（如果页面有匹配状态元素）
                const matchScore = calculateMatchScore(landmarks);
                const statusEl = document.getElementById('pose-match-status');
                if (statusEl && matchScore !== null) {
                    if (matchScore < 0.18) {
                        statusEl.textContent = '✅ 完美匹配！可以拍照了！';
                        statusEl.style.color = '#2ecc71';
                    } else if (matchScore < 0.35) {
                        statusEl.textContent = '🟡 接近了 (' + matchScore.toFixed(2) + ')';
                        statusEl.style.color = '#f1c40f';
                    } else {
                        statusEl.textContent = '📐 继续调整姿势...';
                        statusEl.style.color = '#00a8ff';
                    }
                }
            }

            animationFrameId = requestAnimationFrame(loop);
        }
        animationFrameId = requestAnimationFrame(loop);
    }

    // ============ 初始化 MediaPipe ============
    async function initPoseLandmarker() {
        // 等待 module script 加载完成（如果还没加载）
        if (!window._mediapipeModuleReady) {
            console.log('[MediaPipe] 等待 Vision 库加载...');
            await new Promise((resolve) => {
                const timeout = setTimeout(resolve, 5000);
                window.addEventListener('mediapipe-module-ready', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });
            });
        }

        if (!window.FilesetResolver || !window.PoseLandmarker) {
            console.warn('[MediaPipe] Tasks Vision 库不可用（请通过 HTTP 方式访问此页面）');
            return false;
        }

        try {
            const vision = await window.FilesetResolver.forVisionTasks(
                'js/mediapipe/wasm'
            );

            poseLandmarkerVideo = await window.PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'models/pose_landmarker_lite.task',
                    delegate: 'GPU'
                },
                runningMode: 'VIDEO',
                numPoses: 4,
                minPoseDetectionConfidence: 0.5,
                minPosePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            videoLandmarkerReady = true;
            return true;
        } catch (err) {
            console.warn('[MediaPipe] 模型初始化失败:', err);
            return false;
        }
    }

    // ============ 启动摄像头 ============
    async function startCamera(videoEl, canvasEl, poseObj) {
        currentPose = poseObj;
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });

            videoEl.srcObject = cameraStream;
            videoEl.setAttribute('playsinline', '');
            videoEl.muted = true;
            await new Promise((resolve) => {
                videoEl.onloadedmetadata = () => resolve();
                setTimeout(resolve, 3000);
            });
            try { await videoEl.play(); } catch (e) { /* 忽略 */ }

            // 先启动检测循环（参考骨架立即显示，不受 AI 加载影响）
            startDetectionLoop(videoEl, canvasEl);

            // 后台加载 AI 模型
            if (!videoLandmarkerReady) {
                initPoseLandmarker().then(success => {
                    if (success) {
                        console.log('[MediaPipe] AI 模型就绪，开始姿势检测');
                    }
                });
            }

            return true;
        } catch (err) {
            console.error('[MediaPipe] 摄像头启动失败:', err);
            return false;
        }
    }

    // ============ 停止摄像头 ============
    function stopCamera(videoEl) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            cameraStream = null;
        }
        if (videoEl && videoEl.srcObject) {
            videoEl.srcObject = null;
        }
    }

    // ============ 拍照保存 ============
    function captureSkeletonPhoto(videoEl, canvasEl, poseObj) {
        if (!videoEl || !videoEl.videoWidth) return null;

        const comp = document.createElement('canvas');
        comp.width = 1600;
        comp.height = 900;
        const ctx = comp.getContext('2d');

        // 背景
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, comp.width, comp.height);

        // 左侧：参考照片
        const leftW = comp.width / 2;
        if (poseObj && poseObj.img) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function () {
                const scale = Math.min((leftW - 40) / img.width, (comp.height - 80) / img.height);
                const dw = img.width * scale;
                const dh = img.height * scale;
                const dx = (leftW - dw) / 2;
                const dy = 70;

                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, leftW, comp.height);
                try { ctx.drawImage(img, dx, dy, dw, dh); } catch (e) {}

                // 绘制参考骨架
                if (poseObj.skeleton) {
                    const template = getSkeletonTemplate(poseObj.skeleton);
                    if (template) {
                        template.persons.forEach((person, idx) => {
                            const p = {};
                            for (let k in person) {
                                p[k] = person[k];
                            }
                            // 简化绘制
                            for (let i = 0; i < 33; i++) {
                                if (p[i]) {
                                    p[i] = { x: p[i].x, y: p[i].y, v: p[i].v };
                                }
                            }
                            // 跳过复杂绘制，用通用逻辑
                            drawPersonSkeletonWrapper(ctx, p, dx, dy, dw, dh, idx, true);
                        });
                    }
                }

                ctx.fillStyle = '#f39c12';
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('参考姿势', leftW / 2, 40);
            };
            img.src = poseObj.img;
        }

        // 右侧：用户画面
        const rightW = comp.width / 2;
        const rightX = leftW;
        ctx.fillStyle = '#000';
        ctx.fillRect(rightX, 0, rightW, comp.height);

        const vw = videoEl.videoWidth;
        const vh = videoEl.videoHeight;
        const vScale = Math.min((rightW - 40) / vw, (comp.height - 80) / vh);
        const vDrawW = vw * vScale;
        const vDrawH = vh * vScale;
        const vDrawX = rightX + (rightW - vDrawW) / 2;
        const vDrawY = 70;

        ctx.save();
        ctx.translate(vDrawX + vDrawW, vDrawY);
        ctx.scale(-1, 1);
        try { ctx.drawImage(videoEl, 0, 0, vDrawW, vDrawH); } catch (e) {}
        ctx.restore();

        // 绘制用户骨架
        if (videoLandmarkerReady && poseLandmarkerVideo) {
            try {
                const result = poseLandmarkerVideo.detectForVideo(videoEl, performance.now());
                if (result && result.landmarks && result.landmarks.length > 0) {
                    result.landmarks.forEach((lm, idx) => {
                        const person = {};
                        lm.forEach((p, i) => {
                            person[i] = {
                                x: p.x,
                                y: p.y,
                                v: (typeof p.visibility === 'number' ? p.visibility : 1)
                            };
                        });
                        drawPersonSkeletonWrapper(ctx, person, vDrawX, vDrawY, vDrawW, vDrawH, idx, false);
                    });
                }
            } catch (e) {}
        }

        ctx.fillStyle = '#00a8ff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('你的画面', rightX + rightW / 2, 40);

        // 分隔线
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftW, 0);
        ctx.lineTo(leftW, comp.height);
        ctx.stroke();

        return comp;
    }

    function drawPersonSkeletonWrapper(ctx, person, ox, oy, aw, ah, idx, isRef) {
        drawPersonSkeleton(ctx, person, ox, oy, aw, ah, idx, isRef);
    }

    // ============ 导出公共 API ============
    window.MediaPipeSkeleton = {
        init: initPoseLandmarker,
        startCamera: startCamera,
        stopCamera: stopCamera,
        renderReference: renderReferenceSkeletonOnImage,
        capture: captureSkeletonPhoto,
        getTemplate: getSkeletonTemplate,
        isReady: function () { return videoLandmarkerReady; }
    };

    // 自动初始化（延迟一点，确保 JS 依赖已加载）
    setTimeout(() => {
        if (!videoLandmarkerReady) {
            initPoseLandmarker();
        }
    }, 800);
})();
