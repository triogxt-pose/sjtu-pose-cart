// ===== 主应用逻辑 =====
// 页面路由、全局状态、初始化

(function () {
    'use strict';

    let currentStage = 'stage-cover';
    let currentFilter = 'all';

    // ===== 页面路由 =====
    function goToStage(stageId) {
        document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(stageId);
        if (target) {
            target.classList.add('active');
            currentStage = stageId;
        }

        switch (stageId) {
            case 'stage-shop':
                renderShop();
                break;
            case 'stage-cart':
                renderCart();
                break;
            case 'stage-result':
                renderResult();
                break;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ===== 初始化 =====
    function init() {
        initCart();
        initChat();
        initCover();
        updateCartBadge();
    }

    // ===== 封面页 =====
    function initCover() {
        initCoverVideo();
        initCoverCarousel();
        initParticles();
        initLoadingAnimation();
    }

    // 视频背景
    const coverVideos = ['assets/images/cover/siyuan_lake.mp4', 'assets/images/cover/temple_gate.mp4', 'assets/images/cover/triumphal_arch.mp4'];

    function initCoverVideo() {
        const video = document.getElementById('cover-bg-video');
        const fallback = document.querySelector('.cover-bg-fallback');
        if (!video) return;

        // 随机选择一个视频播放
        const randomVideo = coverVideos[Math.floor(Math.random() * coverVideos.length)];
        const source = document.createElement('source');
        source.src = randomVideo;
        source.type = 'video/mp4';
        video.appendChild(source);

        // 检测视频是否可播放
        video.addEventListener('loadeddata', () => {
            video.style.opacity = '1';
        });

        video.addEventListener('error', () => {
            if (fallback) fallback.classList.add('show');
            video.style.display = 'none';
        });

        // 超时3秒后显示降级背景
        setTimeout(() => {
            if (video.readyState < 2) {
                if (fallback) fallback.classList.add('show');
                video.style.display = 'none';
            }
        }, 3000);

        video.style.opacity = '0';
        video.style.transition = 'opacity 1.5s ease';
        video.play().catch(() => {
            if (fallback) fallback.classList.add('show');
        });
    }

    // 封面轮播（降级）
    let carouselTimer = null;
    const carouselImages = [
        'assets/images/cover/siyuan_lake.jpg',
        'assets/images/cover/temple_gate.jpg',
        'assets/images/cover/triumphal_arch.jpg'
    ];

    function initCoverCarousel() {
        const slides = document.querySelectorAll('.cover-bg-slide');
        if (slides.length === 0) return;

        let idx = 0;
        function showSlide() {
            slides.forEach(s => s.classList.remove('active'));
            const img = new Image();
            img.onload = () => {
                slides[idx].style.backgroundImage = `url(${carouselImages[idx]})`;
                slides[idx].classList.add('active');
                idx = (idx + 1) % carouselImages.length;
            };
            img.onerror = () => {
                idx = (idx + 1) % carouselImages.length;
            };
            img.src = carouselImages[idx];
        }

        showSlide();
        carouselTimer = setInterval(showSlide, 5000);
    }

    // 光斑粒子
    function initParticles() {
        const container = document.getElementById('cover-particles');
        if (!container) return;

        for (let i = 0; i < 35; i++) {
            const particle = document.createElement('div');
            particle.className = 'cover-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${60 + Math.random() * 40}%`;
            particle.style.animationDelay = `${Math.random() * 8}s`;
            particle.style.animationDuration = `${5 + Math.random() * 6}s`;
            const size = 2 + Math.random() * 8;
            particle.style.width = particle.style.height = `${size}px`;
            particle.style.opacity = `${0.1 + Math.random() * 0.3}`;
            container.appendChild(particle);
        }
    }

    // 校徽 Loading 动画
    function initLoadingAnimation() {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) return;

        const circle = document.getElementById('loading-circle');
        const loadingText = document.getElementById('loading-text');
        const circumference = 283;

        const messages = [
            '正在准备你的毕业企划...',
            '调取交大校园地图...',
            '加载经典拍摄姿势...',
            'AI 策划师已就位...',
            '正在连接思源湖信号...',
            '整理宣怀大道拍摄点...'
        ];

        let progress = 0;
        let msgIdx = 0;
        const msgInterval = setInterval(() => {
            if (loadingText) {
                loadingText.textContent = messages[msgIdx % messages.length];
                msgIdx++;
            }
        }, 1400);

        const loadInterval = setInterval(() => {
            progress += Math.random() * 25;
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadInterval);
                clearInterval(msgInterval);
                if (loadingText) loadingText.textContent = '一切就绪，开启你的毕业之旅吧！';
                if (circle) circle.style.strokeDashoffset = 0;

                setTimeout(() => {
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.6s ease';
                    setTimeout(() => {
                        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    }, 600);
                }, 600);
            }
            if (circle) {
                const offset = circumference - (progress / 100) * circumference;
                circle.style.strokeDashoffset = offset;
            }
        }, 80);
    }

    // 开始使用
    function startJourney() {
        // 停止轮播
        if (carouselTimer) clearInterval(carouselTimer);
        // 暂停视频以节省资源
        const video = document.getElementById('cover-bg-video');
        if (video) video.pause();
        goToStage('stage-shop');
    }

    // ===== 主工作台 =====
    function renderShop() {
        renderRecommendations();
        renderVintageSection();
        updateCartBadge();
    }

    // 筛选
    function applyFilter(filter, el) {
        currentFilter = filter;
        document.querySelectorAll('#filter-bar .filter-chip').forEach(c => c.classList.remove('active'));
        if (el) el.classList.add('active');
        renderRecommendations();
    }

    // 推荐渲染
    function renderRecommendations() {
        // 地点瀑布流
        const locContainer = document.getElementById('location-waterfall');
        if (locContainer) {
            const shuffled = [...LOCATIONS].sort(() => Math.random() - 0.5).slice(0, 4);
            locContainer.innerHTML = shuffled.map(l => `
                <div class="rec-card">
                    <div class="rec-card-img" style="background:linear-gradient(135deg,var(--primary-light),var(--primary));">
                        <img src="${l.img}" alt="${l.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                        <span class="rec-card-emoji" style="display:none">${l.emoji}</span>
                    </div>
                    <div class="rec-card-body">
                        <div class="rec-card-title">${l.name}</div>
                        <div class="rec-card-meta">${l.desc}</div>
                        <button class="rec-card-btn" onclick="addToCart('location',{id:'${l.id}',name:'${l.name}',emoji:'${l.emoji}'});updateCartBadge();">🛒 加入购物车</button>
                    </div>
                </div>
            `).join('');
        }

        // 姿势瀑布流
        const poseContainer = document.getElementById('pose-waterfall');
        if (poseContainer) {
            let poses = [...POSES];
            if (currentFilter !== 'all') {
                poses = poses.filter(p => p.people === currentFilter);
            }
            const shuffled = poses.sort(() => Math.random() - 0.5).slice(0, 4);
            poseContainer.innerHTML = shuffled.map(p => `
                <div class="rec-card">
                    <div class="rec-card-img" style="background:linear-gradient(135deg,var(--accent),var(--accent-light));">
                        <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                        <span class="rec-card-emoji" style="display:none">${p.emoji}</span>
                        ${p.hasSkeleton ? '<span class="vintage-tag">AI比对</span>' : ''}
                    </div>
                    <div class="rec-card-body">
                        <div class="rec-card-title">${p.name}</div>
                        <div class="rec-card-meta">${p.people}人 · ${p.style}</div>
                        <button class="rec-card-btn" onclick="addToCart('pose',{id:'${p.id}',name:'${p.name}',emoji:'${p.emoji}',hasSkeleton:${p.hasSkeleton||false}});updateCartBadge();">🛒 加入购物车</button>
                    </div>
                </div>
            `).join('');
        }
    }

    // 经典照片复刻专区
    function renderVintageSection() {
        const container = document.getElementById('vintage-cards');
        if (!container) return;

        const vintagePoses = POSES.filter(p => p.hasSkeleton);
        container.innerHTML = vintagePoses.map(p => `
            <div class="rec-card">
                <div class="rec-card-img" style="background:linear-gradient(135deg,var(--accent),var(--accent-light));">
                    <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                    <span class="rec-card-emoji" style="display:none">${p.emoji}</span>
                    <span class="vintage-tag">AI比对</span>
                </div>
                <div class="rec-card-body">
                    <div class="rec-card-title">${p.name}</div>
                    <div class="rec-card-meta">${p.people}人 · ${p.desc}</div>
                    <button class="rec-card-btn" onclick="addToCart('pose',{id:'${p.id}',name:'${p.name}',emoji:'${p.emoji}',hasSkeleton:true});updateCartBadge();">🛒 加入购物车</button>
                </div>
            </div>
        `).join('');
    }

    function showAllVintagePoses() {
        showAllPoses();
        applyModalFilter('经典照片', document.querySelector('[data-modal-filter="经典照片"]'));
    }

    // ===== 弹窗：地点库 =====
    function showAllLocations() {
        const container = document.getElementById('all-locations-grid');
        if (!container) return;

        container.innerHTML = LOCATIONS.map(l => `
            <div class="rec-card">
                <div class="rec-card-img" style="background:linear-gradient(135deg,var(--primary-light),var(--primary));">
                    <img src="${l.img}" alt="${l.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                    <span class="rec-card-emoji" style="display:none">${l.emoji}</span>
                </div>
                <div class="rec-card-body">
                    <div class="rec-card-title">${l.name}</div>
                    <div class="rec-card-meta">${l.desc} · ${l.bestTime}</div>
                    <button class="rec-card-btn" onclick="addToCart('location',{id:'${l.id}',name:'${l.name}',emoji:'${l.emoji}'});updateCartBadge();closeModal('modal-locations');">🛒 加入购物车</button>
                </div>
            </div>
        `).join('');

        openModal('modal-locations');
    }

    // ===== 弹窗：姿势库 =====
    function showAllPoses() {
        renderModalPoses('all');
        openModal('modal-poses');
    }

    function renderModalPoses(filter) {
        const container = document.getElementById('all-poses-grid');
        if (!container) return;

        let poses = [...POSES];
        if (filter !== 'all') {
            if (filter === '经典照片') {
                poses = poses.filter(p => p.hasSkeleton);
            } else {
                poses = poses.filter(p => p.people === filter);
            }
        }

        container.innerHTML = poses.map(p => `
            <div class="rec-card">
                <div class="rec-card-img" style="background:linear-gradient(135deg,var(--accent),var(--accent-light));">
                    <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                    <span class="rec-card-emoji" style="display:none">${p.emoji}</span>
                    ${p.hasSkeleton ? '<span class="vintage-tag">AI比对</span>' : ''}
                </div>
                <div class="rec-card-body">
                    <div class="rec-card-title">${p.name}</div>
                    <div class="rec-card-meta">${p.people}人 · ${p.style}</div>
                    <button class="rec-card-btn" onclick="addToCart('pose',{id:'${p.id}',name:'${p.name}',emoji:'${p.emoji}',hasSkeleton:${p.hasSkeleton||false}});updateCartBadge();">🛒 加入购物车</button>
                </div>
            </div>
        `).join('');
    }

    function applyModalFilter(filter, el) {
        document.querySelectorAll('#modal-poses .filter-chip').forEach(c => c.classList.remove('active'));
        if (el) el.classList.add('active');
        renderModalPoses(filter);
    }

    // ===== 弹窗管理 =====
    function openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('show');
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('show');
    }

    // ===== 购物车页 =====
    function renderCart() {
        const cartEmpty = document.getElementById('cart-empty');
        const cartContent = document.getElementById('cart-content');
        const total = cartItems.locations.length + cartItems.poses.length;

        if (cartEmpty && cartContent) {
            cartEmpty.style.display = total === 0 ? 'block' : 'none';
            cartContent.style.display = total > 0 ? 'block' : 'none';
        }

        // 更新摘要
        const locCountEl = document.getElementById('cart-location-count');
        const poseCountEl = document.getElementById('cart-pose-count');
        if (locCountEl) locCountEl.textContent = cartItems.locations.length;
        if (poseCountEl) poseCountEl.textContent = cartItems.poses.length;

        // 渲染地点列表
        const locList = document.getElementById('cart-locations-list');
        const poseList = document.getElementById('cart-poses-list');
        const locColCount = document.getElementById('loc-col-count');
        const poseColCount = document.getElementById('pose-col-count');

        if (locList) {
            locList.innerHTML = cartItems.locations.map(l => `
                <div class="cart-item"
                     draggable="true"
                     data-type="location"
                     data-id="${l.id}"
                     data-name="${l.name}"
                     ondragstart="cartDragStart(event)"
                     ondragover="cartDragOver(event)"
                     ondragleave="cartDragLeave(event)"
                     ondrop="cartDrop(event)">
                    <span class="cart-item-check" onclick="event.stopPropagation();toggleCartCheck(this)">☐</span>
                    <span class="cart-item-emoji">${l.emoji || '🏛️'}</span>
                    <span class="cart-item-name">${l.name}</span>
                    <span class="cart-item-delete" onclick="removeFromCart('location','${l.id}')">🗑️</span>
                </div>
            `).join('');
            if (locColCount) locColCount.textContent = cartItems.locations.length;
        }

        if (poseList) {
            poseList.innerHTML = cartItems.poses.map(p => `
                <div class="cart-item"
                     draggable="true"
                     data-type="pose"
                     data-id="${p.id}"
                     data-name="${p.name}"
                     ondragstart="cartDragStart(event)"
                     ondragover="cartDragOver(event)"
                     ondragleave="cartDragLeave(event)"
                     ondrop="cartDrop(event)">
                    <span class="cart-item-check" onclick="event.stopPropagation();toggleCartCheck(this)">☐</span>
                    <span class="cart-item-emoji">${p.emoji || '🕺'}</span>
                    <span class="cart-item-name">${p.name}</span>
                    <span class="cart-item-delete" onclick="removeFromCart('pose','${p.id}')">🗑️</span>
                </div>
            `).join('');
            if (poseColCount) poseColCount.textContent = cartItems.poses.length;
        }

        // 渲染绑定列表
        const bindingList = document.getElementById('bindings-list');
        const bindingCount = document.getElementById('bindings-count');
        if (bindingList) {
            const bindings = [];
            Object.entries(cartBindings).forEach(([locId, poseIds]) => {
                const loc = cartItems.locations.find(l => l.id === locId);
                poseIds.forEach(pid => {
                    const pose = cartItems.poses.find(p => p.id === pid);
                    if (loc && pose) {
                        bindings.push({ locId, poseId: pid, locName: loc.name, poseName: pose.name });
                    }
                });
            });
            bindingList.innerHTML = bindings.map(b => `
                <div class="binding-item">
                    <span>📍 ${b.locName}</span>
                    <span class="bind-arrow">→</span>
                    <span>🕺 ${b.poseName}</span>
                    <span class="bind-remove" onclick="unbindCartItem('${b.locId}','${b.poseId}')">✕</span>
                </div>
            `).join('');
            if (bindingCount) bindingCount.textContent = bindings.length;
        }

        updateCartBadge();
    }

    // 随机组合
    function randomCombine() {
        randomBind();
        renderCart();
    }

    // AI 智能组合
    function aiAutoBind() {
        randomBind();
        renderCart();
        showToast('AI 智能组合完成！');
    }

    // 清除所有绑定
    function clearAllBindings() {
        cartBindings = {};
        saveCart();
        renderCart();
        showToast('已清除所有绑定');
    }

    // ===== 订单交付页 =====
    function renderResult() {
        const cartData = getCartData();
        const boundLocs = getBoundLocations();

        // 如果没有绑定，自动随机组合
        if (boundLocs.length === 0 && cartData.locations.length > 0 && cartData.poses.length > 0) {
            randomBind();
            renderCart();
            return renderResult();
        }

        if (cartData.locations.length === 0) {
            showToast('请先添加拍摄地点');
            goToStage('stage-cart');
            return;
        }

        const locations = boundLocs.length > 0 ? boundLocs : cartData.locations.map(l => ({ ...l, poses: [] }));
        const allPoses = cartData.poses;

        renderRouteMap(locations);
        renderPoseGuide(locations, allPoses);
        renderAICopy(locations, allPoses);
    }

    // 智能路线图
    function renderRouteMap(locations) {
        const container = document.getElementById('result-route');
        if (!container) return;

        const sorted = [...locations].sort((a, b) => {
            const idxA = OPTIMAL_ROUTE_ORDER.indexOf(a.name);
            const idxB = OPTIMAL_ROUTE_ORDER.indexOf(b.name);
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        });

        let totalTime = 0;
        let html = '';
        sorted.forEach((loc, i) => {
            const stayTime = LOCATIONS.find(l => l.name === loc.name)?.stayTime || 20;
            totalTime += stayTime;
            html += `
                <div class="route-step">
                    <div class="route-num">${i + 1}</div>
                    <div class="route-content">
                        <div class="route-location-name">${loc.emoji || '🏛️'} ${loc.name}</div>
                        <div class="route-time">⏱ 预计停留 ${stayTime} 分钟</div>
                        <div class="route-pose-name">
                            ${(loc.poses || []).map(p => `${p.emoji || '🕺'} ${p.name}`).join(' · ')}
                        </div>
                    </div>
                </div>
            `;
            if (i < sorted.length - 1) {
                html += '<div class="route-line"></div>';
            }
        });

        html += `
            <div class="route-total-time">
                📍 共 ${sorted.length} 个地点 · 预计总时长约 ${totalTime} 分钟
            </div>
        `;

        container.innerHTML = html;
    }

    // 姿势说明书
    function renderPoseGuide(locations, allPoses) {
        const container = document.getElementById('result-guide');
        if (!container) return;

        container.innerHTML = locations.map((loc, i) => {
            const poses = (loc.poses && loc.poses.length > 0) ? loc.poses : allPoses.slice(0, 2);
            return `
                <div class="guide-card ${i === 0 ? 'expanded' : ''}" onclick="this.classList.toggle('expanded')">
                    <div class="guide-card-header">
                        <span class="guide-emoji">${loc.emoji || '🏛️'}</span>
                        <div class="guide-info">
                            <div class="guide-title">${loc.name}</div>
                            <div class="guide-subtitle">${poses.length} 个建议姿势</div>
                        </div>
                        <span class="guide-expand">▼</span>
                    </div>
                    <div class="guide-card-body">
                        <div class="guide-poses">
                            ${poses.map(p => `<span class="guide-pose-tag">${p.emoji || '🕺'} ${p.name}</span>`).join('')}
                        </div>
                        ${poses.some(p => p.hasSkeleton) ? `
                            <button class="guide-action-btn" onclick="startMediaPipe('${poses.find(p => p.hasSkeleton)?.id}')">
                                📷 开启AI姿势比对
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // AI 朋友圈文案
    async function renderAICopy(locations, allPoses) {
        const container = document.getElementById('result-copy');
        if (!container) return;

        // 显示加载动画
        container.innerHTML = `
            <div class="copy-loading">
                <div class="typing-dots" style="color:var(--primary);font-size:14px;">
                    AI 正在为你生成朋友圈文案<span>.</span><span>.</span><span>.</span>
                </div>
            </div>
        `;

        const style = allPoses.length > 0 ? allPoses[0].style || '经典' : '经典';
        const remoteCopy = await generateAICopyText(locations, allPoses, style);

        if (remoteCopy) {
            // 按风格分割，过滤空白项
            const parts = remoteCopy.split(/\n(?=💌|🎭|📋)/).filter(p => p.trim());
            // 只取前 3 个风格
            const validParts = parts.slice(0, 3);
            container.innerHTML = validParts.map(part => {
                const lines = part.trim().split('\n');
                const styleName = lines[0] || '';
                const text = lines.slice(1).join('\n').trim() || part.trim();
                return `
                    <div class="result-copy-item">
                        <div class="copy-style">${styleName}</div>
                        <div class="copy-text">${text}</div>
                        <button class="copy-btn" onclick="copyText('${escapeForCopy(text)}')">📋 复制</button>
                    </div>
                `;
            }).join('');
        } else {
            const styles = ['深情', '搞怪', '正经'];
            const year = new Date().getFullYear();
            const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
            const locNames = locations.map(l => l.name || l.locationName).join('、');

            container.innerHTML = styles.map(key => {
                const templates = COPY_TEMPLATES[key];
                if (!templates || templates.length === 0) return '';
                const tpl = templates[Math.floor(Math.random() * templates.length)];
                const text = tpl.text
                    .replace('{year}', year)
                    .replace('{date}', date)
                    .replace('{locations}', locNames);
                return `
                    <div class="result-copy-item">
                        <div class="copy-style">${tpl.style}</div>
                        <div class="copy-text">${text}</div>
                        <button class="copy-btn" onclick="copyText('${escapeForCopy(text)}')">📋 复制</button>
                    </div>
                `;
            }).filter(Boolean).join('');
        }
    }

    // 安全转义文案中的特殊字符
    function escapeForCopy(text) {
        return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    }

    // 复制文案
    function copyText(text) {
        const decoded = text.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
        if (navigator.clipboard) {
            navigator.clipboard.writeText(decoded).then(() => showToast('已复制到剪贴板'));
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = decoded;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showToast('已复制到剪贴板');
            } catch (e) {
                showToast('复制失败，请手动选择文本');
            }
            document.body.removeChild(textarea);
        }
    }

    // 保存/分享企划
    function savePlan() {
        showToast('企划已保存！');
    }

    function sharePlan() {
        if (navigator.share) {
            navigator.share({
                title: '我的交大毕业照企划',
                text: '来看看我的毕业照拍摄方案！',
                url: window.location.href
            }).catch(() => {});
        } else {
            copyText('来看看我的交大毕业照拍摄方案！' + window.location.href);
            showToast('链接已复制，分享给同学吧～');
        }
    }

    // ===== MediaPipe =====
    function startMediaPipe(poseId) {
        const pose = POSES.find(p => p.id === poseId);
        if (!pose) return;
        openMediaPipe(pose);
    }

    function openMediaPipe(pose) {
        const modal = document.getElementById('modal-mediapipe');
        if (!modal) return;

        modal.classList.add('show');
        const thumb = document.getElementById('pose-thumbnail');
        if (thumb) {
            thumb.innerHTML = `<span style="font-size:32px;">${pose.emoji || '🕺'}</span><span style="font-size:10px;">${pose.name}</span>`;
        }
        initMediaPipeCamera(pose);
    }

    function closeMediaPipe() {
        stopCamera();
        const modal = document.getElementById('modal-mediapipe');
        if (modal) modal.classList.remove('show');
    }

    function switchTargetPose() {
        // 循环切换经典照片姿势
        const vintagePoses = POSES.filter(p => p.hasSkeleton);
        if (vintagePoses.length === 0) return;
        stopCamera();
        const currentId = currentPose?.id;
        const idx = vintagePoses.findIndex(p => p.id === currentId);
        const next = vintagePoses[(idx + 1) % vintagePoses.length];
        openMediaPipe(next);
    }

    // ===== Toast =====
    let toastTimer = null;
    function showToast(msg) {
        const el = document.getElementById('toast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), APP_CONFIG.toastDuration || 2000);
    }

    // ===== 导出 =====
    window.goToStage = goToStage;
    window.startJourney = startJourney;
    window.applyFilter = applyFilter;
    window.applyModalFilter = applyModalFilter;
    window.showAllLocations = showAllLocations;
    window.showAllPoses = showAllPoses;
    window.showAllVintagePoses = showAllVintagePoses;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.randomCombine = randomCombine;
    window.aiAutoBind = aiAutoBind;
    window.clearAllBindings = clearAllBindings;
    window.renderCart = renderCart;
    window.savePlan = savePlan;
    window.sharePlan = sharePlan;
    window.startMediaPipe = startMediaPipe;
    window.openMediaPipe = openMediaPipe;
    window.closeMediaPipe = closeMediaPipe;
    window.switchTargetPose = switchTargetPose;
    window.copyText = copyText;
    window.showToast = showToast;

    // 启动
    document.addEventListener('DOMContentLoaded', init);
})();