// ============================================================
// ===== MediaPipe 实时骨架检测 + 姿势匹配引导系统 v5.0 =====
// ============================================================
//  更新：仅使用 HandLandmarker + FaceLandmarker，移除 PoseLandmarker
//        参考框架包含：手部关键点 + 面部网格
// ============================================================

(function () {
    'use strict';

    // ============ 全局状态 ============
    let cameraStream = null;
    let animationFrameId = null;
    let currentPose = null;
    let canvasCtx = null;
    let showSkeleton = true;

    // 两个模型实例（手部 + 面部）
    let handLandmarkerVideo = null;
    let faceLandmarkerVideo = null;

    // 模型就绪状态
    let handsReady = false;
    let faceReady = false;

    // 初始化锁
    let initPromise = null;

    // ============ 手部连接（21 个关键点） ============
    const HAND_CONNECTIONS = [
        // 拇指
        [0, 1], [1, 2], [2, 3], [3, 4],
        // 食指
        [0, 5], [5, 6], [6, 7], [7, 8],
        // 中指
        [0, 9], [9, 10], [10, 11], [11, 12],
        // 无名指
        [0, 13], [13, 14], [14, 15], [15, 16],
        // 小指
        [0, 17], [17, 18], [18, 19], [19, 20],
        // 指根连接
        [5, 9], [9, 13], [13, 17]
    ];

    // ============ 面部网格简化连接（从 478 点中选取关键轮廓） ============
    // 脸型轮廓（33 个点，沿面部边缘）
    const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
                       397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
                       172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];

    // 左眼（16 个点）
    const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
    // 右眼（16 个点）
    const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];

    // 左眉（5 个点）
    const LEFT_EYEBROW = [70, 63, 105, 66, 107];
    // 右眉（5 个点）
    const RIGHT_EYEBROW = [336, 296, 334, 293, 300];

    // 鼻子（9 个点）
    const NOSE_BRIDGE = [168, 6, 197, 195, 5, 4, 1, 19, 94];
    // 鼻翼
    const NOSE_WINGS = [98, 97, 2, 326, 327];

    // 嘴唇外轮廓（12 个点）
    const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
    // 嘴唇内轮廓（8 个点）
    const LIPS_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];

    // ============ 配色方案 ============
    const REFERENCE_COLORS = {
        main: 'rgba(255,255,255,0.95)',
        outline: 'rgba(0,0,0,0.7)',
        glow: 'rgba(255,255,255,0.3)',
        box: 'rgba(255,255,255,0.7)'
    };

    const HAND_COLORS = {
        main: '#ff9f43',
        outline: 'rgba(140,60,0,0.7)',
        glow: 'rgba(255,159,67,0.5)',
        joint: '#ffbe76'
    };

    const FACE_COLORS = {
        main: 'rgba(46, 204, 113, 0.7)',
        outline: 'rgba(20, 100, 50, 0.5)',
        glow: 'rgba(46, 204, 113, 0.3)',
        eye: 'rgba(52, 152, 219, 0.8)',
        lip: 'rgba(231, 76, 60, 0.6)'
    };

    // ============ 获取离线骨架模板 ============
    function getSkeletonTemplate(skeletonId) {
        if (window.SKELETON_TEMPLATES && window.SKELETON_TEMPLATES[skeletonId]) {
            return window.SKELETON_TEMPLATES[skeletonId];
        }
        return null;
    }

    // ============ 绘制手部关键点 ============
    function drawHandLandmarks(ctx, landmarks, offsetX, offsetY, areaW, areaH, handLabel, isReference) {
        if (!landmarks || landmarks.length === 0) return;

        const pts = [];
        landmarks.forEach((lm, i) => {
            pts[i] = {
                x: offsetX + lm.x * areaW,
                y: offsetY + lm.y * areaH
            };
        });

        // 参考模式：更细的线条 + 半透明 + 白色
        // 检测模式：原有的粗线条 + 橙色
        const lineOuter = isReference ? 2 : 4;
        const lineInner = isReference ? 1.2 : 2;
        const glow = isReference ? 4 : 8;
        const baseColor = isReference ? 'rgba(255, 255, 255, 0.75)' : HAND_COLORS.main;
        const outlineColor = isReference ? 'rgba(255, 255, 255, 0.25)' : HAND_COLORS.outline;
        const jointColor = isReference ? 'rgba(255, 255, 255, 0.85)' : HAND_COLORS.joint;
        const tipColor = isReference ? 'rgba(255, 180, 100, 0.9)' : '#ff6348';

        // 绘制连接线
        HAND_CONNECTIONS.forEach(([from, to]) => {
            const p1 = pts[from];
            const p2 = pts[to];
            if (!p1 || !p2) return;

            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = lineOuter;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            if (isReference) {
                ctx.shadowBlur = 0;
            } else {
                ctx.shadowColor = HAND_COLORS.glow;
                ctx.shadowBlur = glow;
            }
            ctx.strokeStyle = baseColor;
            ctx.lineWidth = lineInner;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.shadowBlur = 0;
        });

        // 绘制关节点
        landmarks.forEach((lm, i) => {
            const x = pts[i].x;
            const y = pts[i].y;
            const isTip = [4, 8, 12, 16, 20].includes(i);
            const isBase = [0, 1, 5, 9, 13, 17].includes(i);
            let r = isTip ? 4 : (isBase ? 5 : 3);
            if (isReference) r = isTip ? 2.5 : (isBase ? 3 : 1.8);

            ctx.beginPath();
            ctx.arc(x, y, r + 2, 0, Math.PI * 2);
            ctx.fillStyle = outlineColor;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = isTip ? tipColor : jointColor;
            ctx.fill();

            if (!isReference && isBase) {
                ctx.beginPath();
                ctx.arc(x - 1, y - 1, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.fill();
            }
        });

        // 手部标签
        if (handLabel && pts[0]) {
            ctx.font = isReference ? '11px sans-serif' : 'bold 10px sans-serif';
            ctx.fillStyle = isReference ? 'rgba(255, 255, 255, 0.6)' : HAND_COLORS.main;
            ctx.textAlign = 'center';
            ctx.fillText(handLabel, pts[0].x, pts[0].y - 10);
        }
    }

    // ============ 绘制面部网格 ============
    function drawFaceMesh(ctx, landmarks, offsetX, offsetY, areaW, areaH, isReference) {
        if (!landmarks || landmarks.length === 0) return;

        // 将归一化坐标转换为画布坐标
        const pts = [];
        landmarks.forEach((lm, i) => {
            pts[i] = {
                x: offsetX + lm.x * areaW,
                y: offsetY + lm.y * areaH
            };
        });

        // 参考模式：更细线条、白色半透明
        // 检测模式：原有绿色粗线条
        const ovalOuter = isReference ? 2 : 3;
        const ovalInner = isReference ? 1 : 1.5;
        const faceOuter = isReference ? 1.5 : 2.5;
        const faceInner = isReference ? 0.8 : 1.5;
        const lipLine = isReference ? 1 : 1.5;
        const browLine = isReference ? 1 : 2;

        const refMain = 'rgba(255, 255, 255, 0.7)';
        const refOutline = 'rgba(255, 255, 255, 0.25)';
        const refEye = 'rgba(100, 180, 255, 0.75)';
        const refLip = 'rgba(255, 150, 150, 0.75)';

        // 绘制脸型轮廓
        ctx.strokeStyle = isReference ? refOutline : FACE_COLORS.outline;
        ctx.lineWidth = ovalOuter;
        ctx.beginPath();
        for (let i = 0; i < FACE_OVAL.length - 1; i++) {
            const p = pts[FACE_OVAL[i]];
            if (!p) continue;
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = isReference ? refMain : FACE_COLORS.main;
        ctx.lineWidth = ovalInner;
        ctx.beginPath();
        for (let i = 0; i < FACE_OVAL.length - 1; i++) {
            const p = pts[FACE_OVAL[i]];
            if (!p) continue;
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();

        // 绘制眼睛
        [LEFT_EYE, RIGHT_EYE].forEach(eyePoints => {
            ctx.strokeStyle = isReference ? refOutline : FACE_COLORS.outline;
            ctx.lineWidth = faceOuter;
            ctx.beginPath();
            let first = true;
            eyePoints.forEach(idx => {
                const p = pts[idx];
                if (!p) return;
                if (first) { ctx.moveTo(p.x, p.y); first = false; }
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.stroke();

            ctx.strokeStyle = isReference ? refEye : FACE_COLORS.eye;
            ctx.lineWidth = faceInner;
            ctx.beginPath();
            first = true;
            eyePoints.forEach(idx => {
                const p = pts[idx];
                if (!p) return;
                if (first) { ctx.moveTo(p.x, p.y); first = false; }
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.stroke();
        });

        // 绘制眉毛
        [LEFT_EYEBROW, RIGHT_EYEBROW].forEach(browPoints => {
            ctx.strokeStyle = isReference ? refMain : FACE_COLORS.main;
            ctx.lineWidth = browLine;
            ctx.beginPath();
            let first = true;
            browPoints.forEach(idx => {
                const p = pts[idx];
                if (!p) return;
                if (first) { ctx.moveTo(p.x, p.y); first = false; }
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
        });

        // 绘制嘴唇
        [LIPS_OUTER, LIPS_INNER].forEach((lipPoints, lipIdx) => {
            ctx.strokeStyle = isReference ? (lipIdx === 0 ? refOutline : refLip) : (lipIdx === 0 ? FACE_COLORS.outline : FACE_COLORS.lip);
            ctx.lineWidth = lipLine;
            ctx.beginPath();
            let first = true;
            lipPoints.forEach(idx => {
                const p = pts[idx];
                if (!p) return;
                if (first) { ctx.moveTo(p.x, p.y); first = false; }
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.stroke();
        });

        // 绘制鼻子
        ctx.strokeStyle = isReference ? refMain : FACE_COLORS.main;
        ctx.lineWidth = faceInner;
        ctx.beginPath();
        let firstNose = true;
        NOSE_BRIDGE.forEach(idx => {
            const p = pts[idx];
            if (!p) return;
            if (firstNose) { ctx.moveTo(p.x, p.y); firstNose = false; }
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
    }

    // ============ 计算手部匹配度（与参考模板比较） ============
    function calculateHandMatchScore(handLandmarksArray) {
        if (!handLandmarksArray || handLandmarksArray.length === 0) return null;
        if (!currentPose || !currentPose.skeleton) return null;

        const template = getSkeletonTemplate(currentPose.skeleton);
        if (!template || !template.persons || template.persons.length === 0) return null;

        const handScale = 0.08; // 相对归一化的手部尺度
        let bestAvgDist = Infinity;
        let foundMatch = false;

        for (let refIdx = 0; refIdx < Math.min(template.persons.length, 2); refIdx++) {
            const refP = template.persons[refIdx];
            const refHands = [];
            if (refP.handLeft) refHands.push(refP.handLeft);
            if (refP.handRight) refHands.push(refP.handRight);
            if (refHands.length === 0) continue;

            for (let hIdx = 0; hIdx < handLandmarksArray.length; hIdx++) {
                const userHand = handLandmarksArray[hIdx];
                if (!userHand || userHand.length !== 21) continue;

                for (let rh of refHands) {
                    let totalDist = 0;
                    let count = 0;
                    for (let i = 0; i < 21; i++) {
                        const refPt = rh[i];
                        const up = userHand[i];
                        if (!refPt || !up) continue;
                        const dx = ((1 - refPt.x) - up.x) / handScale;
                        const dy = (refPt.y - up.y) / handScale;
                        totalDist += Math.sqrt(dx * dx + dy * dy);
                        count++;
                    }
                    if (count > 10) {
                        const avg = totalDist / count;
                        if (avg < bestAvgDist) bestAvgDist = avg;
                        foundMatch = true;
                    }
                }
            }
        }

        if (!foundMatch) return null;
        return Math.min(bestAvgDist, 1);
    }

    // ============ 计算面部匹配度（与参考模板比较） ============
    function calculateFaceMatchScore(faceLandmarksArray) {
        if (!faceLandmarksArray || faceLandmarksArray.length === 0) return null;
        if (!currentPose || !currentPose.skeleton) return null;

        const template = getSkeletonTemplate(currentPose.skeleton);
        if (!template || !template.persons) return null;

        const faceScale = 0.08;
        let bestAvgDist = Infinity;
        let foundMatch = false;

        for (let refIdx = 0; refIdx < Math.min(template.persons.length, 2); refIdx++) {
            const refP = template.persons[refIdx];
            if (!refP.face) continue;
            const refFace = [];
            refP.face.forEach(pt => { refFace[pt.i] = { x: pt.x, y: pt.y }; });

            for (let fIdx = 0; fIdx < Math.min(2, faceLandmarksArray.length); fIdx++) {
                const userFace = faceLandmarksArray[fIdx];
                if (!userFace || userFace.length < 100) continue;

                let totalDist = 0;
                let count = 0;
                const criticalPoints = [1, 10, 33, 133, 263, 362, 61, 291, 152];
                for (let idx of criticalPoints) {
                    const refPt = refFace[idx];
                    const up = userFace[idx];
                    if (!refPt || !up) continue;
                    const dx = ((1 - refPt.x) - up.x) / faceScale;
                    const dy = (refPt.y - up.y) / faceScale;
                    totalDist += Math.sqrt(dx * dx + dy * dy);
                    count++;
                }
                if (count > 3) {
                    const avg = totalDist / count;
                    if (avg < bestAvgDist) bestAvgDist = avg;
                    foundMatch = true;
                }
            }
        }

        if (!foundMatch) return null;
        return Math.min(bestAvgDist, 1);
    }

    // ============ 综合匹配度（手部 + 面部） ============
    function calculateTotalMatchScore(handResult, faceResult) {
        const scores = [];
        const weights = [];

        const handScore = calculateHandMatchScore(handResult);
        if (handScore !== null) {
            scores.push(handScore);
            weights.push(0.60); // 手部权重更高
        }

        const faceScore = calculateFaceMatchScore(faceResult);
        if (faceScore !== null) {
            scores.push(faceScore);
            weights.push(0.40);
        }

        if (scores.length === 0) return null;

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let weightedScore = 0;
        for (let i = 0; i < scores.length; i++) {
            weightedScore += scores[i] * (weights[i] / totalWeight);
        }

        return weightedScore;
    }

    // ============ 绘制参考骨架（在参考照片上）
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
            // 参考手
            if (person.handLeft) {
                drawHandLandmarks(ctx, person.handLeft, 0, 0, bw, bh, null, true);
            }
            if (person.handRight) {
                drawHandLandmarks(ctx, person.handRight, 0, 0, bw, bh, null, true);
            }
            // 3. 参考脸
            if (person.face) {
                const refFace = [];
                person.face.forEach(pt => { refFace[pt.i] = { x: pt.x, y: pt.y }; });
                drawFaceMesh(ctx, refFace, 0, 0, bw, bh, true);
            }
        });
    }

    // ============ 实时检测循环 ============
    function startDetectionLoop(videoEl, canvasEl) {
        if (!videoEl || !canvasEl) return;
        const ctx = canvasEl.getContext('2d');
        let lastHandTime = 0;
        let lastFaceTime = 0;
        let frameCount = 0;
        let detectCount = 0;
        let cachedHands = null;
        let cachedFace = null;
        let cachedMatchScore = null;
        let modelReadyShown = false;

        function loop(now) {
            try {
                frameCount++;
                if (!cameraStream) return;

                if (videoEl.videoWidth && videoEl.videoHeight) {
                    if (canvasEl.width !== videoEl.videoWidth) {
                        canvasEl.width = videoEl.videoWidth;
                        canvasEl.height = videoEl.videoHeight;
                    }
                }

                ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

                // 先绘制参考人物的骨架
                if (currentPose && currentPose.skeleton) {
                    const template = getSkeletonTemplate(currentPose.skeleton);
                    if (template && template.persons) {
                        // 画参考骨架线条（更细、半透明）
                        template.persons.forEach(person => {
                            if (person.handLeft) {
                                const mirroredHand = person.handLeft.map(pt => ({ x: 1 - pt.x, y: pt.y }));
                                drawHandLandmarks(ctx, mirroredHand, 0, 0, canvasEl.width, canvasEl.height, null, true);
                            }
                            if (person.handRight) {
                                const mirroredHand = person.handRight.map(pt => ({ x: 1 - pt.x, y: pt.y }));
                                drawHandLandmarks(ctx, mirroredHand, 0, 0, canvasEl.width, canvasEl.height, null, true);
                            }
                            if (person.face) {
                                const mirroredFace = [];
                                person.face.forEach(pt => { mirroredFace[pt.i] = { x: 1 - pt.x, y: pt.y }; });
                                drawFaceMesh(ctx, mirroredFace, 0, 0, canvasEl.width, canvasEl.height, true);
                            }
                        });
                    }
                }

                // AI 模型未就绪时显示提示
                if (!handsReady && !faceReady) {
                    const statusEl = document.getElementById('pose-match-status');
                    if (statusEl && !statusEl._aiLoadingShown) {
                        statusEl._aiLoadingShown = true;
                        statusEl.textContent = '⏳ AI 模型加载中...';
                        statusEl.style.color = '#f1c40f';
                    }
                    animationFrameId = requestAnimationFrame(loop);
                    return;
                }

                // AI 模型就绪后，只显示一次状态切换
                if (!modelReadyShown) {
                    modelReadyShown = true;
                    const statusEl = document.getElementById('pose-match-status');
                    if (statusEl) {
                        statusEl.textContent = '✋ 调整手部和面部姿势以匹配参考...';
                        statusEl.style.color = '#ff9f43';
                        delete statusEl._aiLoadingShown;
                    }
                }

                // === 分时检测：手部每 80ms，面部每 120ms ===
                let handLandmarks = null;
                let faceLandmarks = null;

                // 手部检测（每 80ms）
                if (handLandmarkerVideo && handsReady && videoEl.readyState >= 2 && (now - lastHandTime) >= 80) {
                    try {
                        const handResult = handLandmarkerVideo.detectForVideo(videoEl, now);
                        if (handResult && handResult.landmarks) {
                            handLandmarks = handResult.landmarks;
                            cachedHands = handResult.landmarks;
                            lastHandTime = now;
                            detectCount++;
                        }
                    } catch (e) {
                        console.warn('[MediaPipe] 手部检测出错:', e.message || e);
                    }
                }

                // 面部检测（每 120ms）
                if (faceLandmarkerVideo && faceReady && videoEl.readyState >= 2 && (now - lastFaceTime) >= 120) {
                    try {
                        const faceResult = faceLandmarkerVideo.detectForVideo(videoEl, now);
                        if (faceResult && faceResult.faceLandmarks) {
                            faceLandmarks = faceResult.faceLandmarks;
                            cachedFace = faceResult.faceLandmarks;
                            lastFaceTime = now;
                        }
                    } catch (e) {
                        console.warn('[MediaPipe] 面部检测出错:', e.message || e);
                    }
                }

                // 更新综合匹配分数
                if (handLandmarks !== null || faceLandmarks !== null) {
                    cachedMatchScore = calculateTotalMatchScore(
                        cachedHands,
                        cachedFace
                    );
                }

                // === 绘制用户手部骨架 ===
                if (cachedHands && cachedHands.length > 0) {
                    cachedHands.forEach((hand, idx) => {
                        const label = cachedHands.length > 1 ? (idx === 0 ? 'L' : 'R') : '';
                        drawHandLandmarks(ctx, hand, 0, 0, canvasEl.width, canvasEl.height, label);
                    });
                }

                // === 绘制用户面部网格 ===
                if (cachedFace && cachedFace.length > 0) {
                    cachedFace.forEach(face => {
                        drawFaceMesh(ctx, face, 0, 0, canvasEl.width, canvasEl.height);
                    });
                }

                // === 始终显示匹配状态 ===
                const statusEl = document.getElementById('pose-match-status');
                if (statusEl) {
                    if (cachedMatchScore !== null) {
                        const pct = Math.max(0, Math.min(100, Math.round((1 - cachedMatchScore) * 100)));
                        if (cachedMatchScore < 0.15) {
                            statusEl.textContent = '✅ 完美匹配！可以拍照了！(' + pct + '%)';
                            statusEl.style.color = '#2ecc71';
                        } else if (cachedMatchScore < 0.30) {
                            statusEl.textContent = '🟡 接近了 (' + pct + '%)';
                            statusEl.style.color = '#f1c40f';
                        } else {
                            statusEl.textContent = '✋ 继续调整姿势... (' + pct + '%)';
                            statusEl.style.color = '#ff9f43';
                        }
                    } else if (modelReadyShown && !cachedHands && !cachedFace) {
                        statusEl.textContent = '🔍 未检测到手和脸，请面向摄像头并伸出双手...';
                        statusEl.style.color = '#e74c3c';
                    }
                }

                // 每 120 帧输出一次调试信息
                if (frameCount % 120 === 0) {
                    console.log('[MediaPipe v5] 帧:', frameCount, '检测:', detectCount,
                        '手部:', handsReady ? 'OK' : '--',
                        '面部:', faceReady ? 'OK' : '--',
                        '匹配:', cachedMatchScore !== null ? cachedMatchScore.toFixed(3) : 'null');
                }
            } catch (loopErr) {
                console.error('[MediaPipe] 循环异常:', loopErr.message || loopErr, loopErr.stack);
            }

            animationFrameId = requestAnimationFrame(loop);
        }
        animationFrameId = requestAnimationFrame(loop);
    }

    // ============ 初始化所有模型 ============
    async function initAllModels() {
        if (initPromise) return initPromise;
        if (handsReady && faceReady) return true;

        initPromise = (async () => {
            // 等待/加载库
            if (!window.HandLandmarker || !window.FaceLandmarker) {
                if (!window.FilesetResolver) {
                    console.log('[MediaPipe] 动态加载 Tasks Vision 库...');
                    try {
                        const mod = await import('js/mediapipe/vision_bundle.mjs');
                        window.HandLandmarker = mod.HandLandmarker;
                        window.FaceLandmarker = mod.FaceLandmarker;
                        window.FilesetResolver = mod.FilesetResolver;
                        console.log('[MediaPipe] 动态 import 加载成功');
                    } catch (importErr) {
                        console.warn('[MediaPipe] 动态 import 失败:', importErr);
                    }
                }
            }

            if (!window.FilesetResolver || (!window.HandLandmarker && !window.FaceLandmarker)) {
                console.warn('[MediaPipe] Tasks Vision 库不可用');
                return false;
            }

            try {
                const vision = await window.FilesetResolver.forVisionTasks('js/mediapipe/wasm');

                // 移动端优先使用 CPU，桌面端尝试 GPU
                const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
                const delegate = isMobile ? 'CPU' : 'GPU';
                console.log('[MediaPipe] 设备类型:', isMobile ? '移动端' : '桌面端', '→ delegate:', delegate);

                // 初始化 HandLandmarker
                if (window.HandLandmarker) {
                    console.log('[MediaPipe] 初始化手部模型...');
                    try {
                        handLandmarkerVideo = await window.HandLandmarker.createFromOptions(vision, {
                            baseOptions: {
                                modelAssetPath: 'models/hand_landmarker.task',
                                delegate: delegate
                            },
                            runningMode: 'VIDEO',
                            numHands: 4,
                            minHandDetectionConfidence: 0.5,
                            minHandPresenceConfidence: 0.5,
                            minTrackingConfidence: 0.5
                        });
                        handsReady = true;
                        console.log('[MediaPipe] ✅ 手部模型就绪');
                    } catch (handErr) {
                        console.warn('[MediaPipe] 手部模型 GPU 失败，尝试 CPU...');
                        try {
                            handLandmarkerVideo = await window.HandLandmarker.createFromOptions(vision, {
                                baseOptions: {
                                    modelAssetPath: 'models/hand_landmarker.task',
                                    delegate: 'CPU'
                                },
                                runningMode: 'VIDEO',
                                numHands: 4,
                                minHandDetectionConfidence: 0.5,
                                minHandPresenceConfidence: 0.5,
                                minTrackingConfidence: 0.5
                            });
                            handsReady = true;
                            console.log('[MediaPipe] ✅ 手部模型就绪 (CPU fallback)');
                        } catch (handErr2) {
                            console.warn('[MediaPipe] 手部模型初始化失败:', handErr2);
                        }
                    }
                }

                // 初始化 FaceLandmarker
                if (window.FaceLandmarker) {
                    console.log('[MediaPipe] 初始化面部模型...');
                    try {
                        faceLandmarkerVideo = await window.FaceLandmarker.createFromOptions(vision, {
                            baseOptions: {
                                modelAssetPath: 'models/face_landmarker.task',
                                delegate: delegate
                            },
                            runningMode: 'VIDEO',
                            numFaces: 2,
                            minFaceDetectionConfidence: 0.5,
                            minFacePresenceConfidence: 0.5,
                            minTrackingConfidence: 0.5,
                            outputFaceBlendshapes: false,
                            outputFacialTransformationMatrixes: false
                        });
                        faceReady = true;
                        console.log('[MediaPipe] ✅ 面部模型就绪');
                    } catch (faceErr) {
                        console.warn('[MediaPipe] 面部模型 GPU 失败，尝试 CPU...');
                        try {
                            faceLandmarkerVideo = await window.FaceLandmarker.createFromOptions(vision, {
                                baseOptions: {
                                    modelAssetPath: 'models/face_landmarker.task',
                                    delegate: 'CPU'
                                },
                                runningMode: 'VIDEO',
                                numFaces: 2,
                                minFaceDetectionConfidence: 0.5,
                                minFacePresenceConfidence: 0.5,
                                minTrackingConfidence: 0.5,
                                outputFaceBlendshapes: false,
                                outputFacialTransformationMatrixes: false
                            });
                            faceReady = true;
                            console.log('[MediaPipe] ✅ 面部模型就绪 (CPU fallback)');
                        } catch (faceErr2) {
                            console.warn('[MediaPipe] 面部模型初始化失败:', faceErr2);
                        }
                    }
                }

                console.log('[MediaPipe] 所有模型初始化完成');
                return true;
            } catch (err) {
                console.warn('[MediaPipe] 模型初始化失败:', err);
                return false;
            }
        })();

        initPromise.then(result => { if (!result) initPromise = null; });
        return initPromise;
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

            startDetectionLoop(videoEl, canvasEl);

            if (!handsReady && !faceReady) {
                initAllModels().then(success => {
                    if (success) {
                        console.log('[MediaPipe] AI 模型就绪，开始手部+面部检测');
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

        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, comp.width, comp.height);

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

                if (poseObj.skeleton) {
                    const template = getSkeletonTemplate(poseObj.skeleton);
                    if (template) {
                        template.persons.forEach((person, idx) => {
                            if (person.handLeft) drawHandLandmarks(ctx, person.handLeft, dx, dy, dw, dh, null, true);
                            if (person.handRight) drawHandLandmarks(ctx, person.handRight, dx, dy, dw, dh, null, true);
                            if (person.face) {
                                const refFace = [];
                                person.face.forEach(pt => { refFace[pt.i] = { x: pt.x, y: pt.y }; });
                                drawFaceMesh(ctx, refFace, dx, dy, dw, dh, true);
                            }
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

        // 在用户画面上绘制用户手部和面部
        if (handLandmarkerVideo && handsReady) {
            try {
                const result = handLandmarkerVideo.detectForVideo(videoEl, performance.now());
                if (result && result.landmarks && result.landmarks.length > 0) {
                    result.landmarks.forEach((lm, idx) => {
                        const label = result.landmarks.length > 1 ? (idx === 0 ? 'L' : 'R') : '';
                        drawHandLandmarks(ctx, lm, vDrawX, vDrawY, vDrawW, vDrawH, label);
                    });
                }
            } catch (e) {}
        }

        if (faceLandmarkerVideo && faceReady) {
            try {
                const result = faceLandmarkerVideo.detectForVideo(videoEl, performance.now());
                if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
                    result.faceLandmarks.forEach((lm) => {
                        drawFaceMesh(ctx, lm, vDrawX, vDrawY, vDrawW, vDrawH);
                    });
                }
            } catch (e) {}
        }

        ctx.fillStyle = '#00a8ff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('你的画面', rightX + rightW / 2, 40);

        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftW, 0);
        ctx.lineTo(leftW, comp.height);
        ctx.stroke();

        return comp;
    }

    // ============ 导出公共 API ============
    window.MediaPipeSkeleton = {
        init: initAllModels,
        startCamera: startCamera,
        stopCamera: stopCamera,
        renderReference: renderReferenceSkeletonOnImage,
        capture: captureSkeletonPhoto,
        getTemplate: getSkeletonTemplate,
        isHandsReady: function () { return handsReady; },
        isFaceReady: function () { return faceReady; },
        isReady: function () { return handsReady || faceReady; }
    };

    // 自动初始化
    setTimeout(() => {
        if (!handsReady && !faceReady) {
            initAllModels();
        }
    }, 800);
})();
