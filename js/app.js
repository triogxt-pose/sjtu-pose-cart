// ===== 主应用逻辑 =====

// 阶段切换
function goToStage(stageId) {
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    const stage = document.getElementById(stageId);
    if (stage) {
        stage.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 进入特定阶段时的初始化
        if (stageId === 'stage-shop') {
            renderRecommendations();
        } else if (stageId === 'stage-cart') {
            renderCartPage();
        } else if (stageId === 'stage-result') {
            renderResultPage();
        }
    }
}

// 切换商店底部Tab
function switchShopTab(tab) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'recommend') {
        document.querySelector('.recommend-section').style.display = '';
        document.querySelector('.chat-section').style.display = '';
    } else if (tab === 'locations') {
        showAllLocations();
    } else if (tab === 'poses') {
        showAllPoses();
    }
}

// ===== 推荐板块渲染 =====
function renderRecommendations() {
    renderLocationCards(LOCATIONS.slice(0, 4));
    renderPoseCards(POSES.slice(0, 6));
}

function renderLocationCards(locations) {
    const container = document.getElementById('location-cards');
    if (!container) return;
    container.innerHTML = locations.map(l => `
        <div class="card-item">
            <div class="card-img">${l.emoji}</div>
            <div class="card-name">${l.name}</div>
            <div class="card-meta">${l.desc}</div>
            <div class="card-meta" style="font-size:11px;">🕐 ${l.bestTime}</div>
            <button class="card-add-btn" onclick="addToCart('location', {id:'${l.id}',name:'${l.name}',emoji:'${l.emoji}'});updateCartBadge();">
                🛒 加入购物车
            </button>
        </div>
    `).join('');
}

function renderPoseCards(poses) {
    const container = document.getElementById('pose-cards');
    if (!container) return;
    container.innerHTML = poses.map(p => `
        <div class="card-item">
            <div class="card-img">${p.emoji}</div>
            <div class="card-name">${p.name}</div>
            <div class="card-meta">👥 ${p.people}人 · ${p.style}</div>
            <button class="card-add-btn" onclick="addToCart('pose', {id:'${p.id}',name:'${p.name}',emoji:'${p.emoji}',hasSkeleton:${p.hasSkeleton||false}});updateCartBadge();">
                🛒 加入购物车
            </button>
        </div>
    `).join('');
}

// 查看全部地点
function showAllLocations() {
    const grid = document.getElementById('all-locations-grid');
    if (grid) {
        grid.innerHTML = LOCATIONS.map(l => `
            <div class="card-item" style="min-width:auto;max-width:100%;">
                <div class="card-img" style="height:60px;">${l.emoji}</div>
                <div class="card-name">${l.name}</div>
                <div class="card-meta">${l.desc}</div>
                <div class="card-meta">🕐 ${l.bestTime}</div>
                <button class="card-add-btn" onclick="addToCart('location', {id:'${l.id}',name:'${l.name}',emoji:'${l.emoji}'});updateCartBadge();">
                    🛒 加入购物车
                </button>
            </div>
        `).join('');
    }
    document.getElementById('modal-locations').classList.add('show');
}

// 查看全部姿势
function showAllPoses() {
    renderAllPoses(POSES);
    document.getElementById('modal-poses').classList.add('show');
}

function renderAllPoses(poses) {
    const grid = document.getElementById('all-poses-grid');
    if (grid) {
        grid.innerHTML = poses.map(p => `
            <div class="card-item" style="min-width:auto;max-width:100%;">
                <div class="card-img" style="height:60px;">${p.emoji}</div>
                <div class="card-name">${p.name}</div>
                <div class="card-meta">👥 ${p.people}人 · ${p.style}</div>
                <button class="card-add-btn" onclick="addToCart('pose', {id:'${p.id}',name:'${p.name}',emoji:'${p.emoji}',hasSkeleton:${p.hasSkeleton||false}});updateCartBadge();">
                    🛒 加入购物车
                </button>
            </div>
        `).join('');
    }
}

// 姿势筛选
function filterPoses() {
    const people = document.getElementById('filter-people').value;
    const style = document.getElementById('filter-style').value;
    let filtered = POSES;
    if (people) filtered = filtered.filter(p => p.people === people);
    if (style) filtered = filtered.filter(p => p.style === style);
    renderPoseCards(filtered.slice(0, 6));
}

function filterModalPoses() {
    const people = document.getElementById('modal-filter-people').value;
    const style = document.getElementById('modal-filter-style').value;
    let filtered = POSES;
    if (people) filtered = filtered.filter(p => p.people === people);
    if (style) filtered = filtered.filter(p => p.style === style);
    renderAllPoses(filtered);
}

// 关闭弹窗
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// 点击弹窗背景关闭
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// ===== 阶段四：交付页 =====
function renderResultPage() {
    renderCopySection();
    renderRouteSection();
    renderGuideSection();
}

// AI 朋友圈文案 (参考 LLM 调用模式)
function renderCopySection() {
    const container = document.getElementById('result-copy');
    if (!container) return;

    const year = new Date().getFullYear();
    const date = `${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日`;

    let copies = [];

    // 根据用户选择的风格生成文案
    const selectedStyles = [...new Set(cart.poses.map(p => {
        const pose = POSES.find(pp => pp.id === p.id);
        return pose ? pose.style : '';
    }).filter(Boolean))];

    if (selectedStyles.includes('搞笑') || selectedStyles.includes('活泼')) {
        copies.push({
            style: '🎭 搞怪风',
            text: '🎓 顺利毕业！\n感谢室友不杀之恩\n感谢食堂阿姨的手抖\n感谢交大让我遇见你们\n\nSJTUers，江湖再见！👋'
        });
    }

    if (selectedStyles.includes('老照片') || selectedStyles.includes('复古')) {
        copies.push({
            style: '📷 复古风',
            text: `从南洋公学到上海交大\n百廿余年，弦歌不辍\n今日我们在此定格\n续写属于这个时代的篇章\n\n${date} 摄于交大校园`
        });
    }

    // 深情风（默认必有）
    copies.push({
        style: '💌 深情风',
        text: `在思源湖畔的晚风里\n在东川路的梧桐树下\n我们用四年的时光\n写下了最好的青春\n\n毕业快乐 | SJTU ${year}`
    });

    container.innerHTML = copies.map((c, i) => `
        <div class="result-copy-item">
            <strong>${c.style}</strong>
            <pre style="margin:8px 0 0;font-family:inherit;white-space:pre-wrap;">${c.text}</pre>
            <button class="copy-btn" onclick="copyText('${c.text.replace(/'/g, "\\'").replace(/\n/g, '\\n')}')">📋 一键复制</button>
        </div>
    `).join('');
}

// 智能路线图 (最短路径贪心算法)
function renderRouteSection() {
    const container = document.getElementById('result-route');
    if (!container) return;

    const locations = cart.bindings.length > 0
        ? cart.bindings.map(b => ({
            name: b.locationName,
            pose: b.poseName
        }))
        : cart.locations.map(l => ({ name: l.name, pose: '' }));

    if (locations.length === 0) {
        container.innerHTML = '<p style="color:#999;">请先在购物车中添加拍摄地点</p>';
        return;
    }

    // 简单路线规划：按照校园最优游览顺序排列
    const OPTIMAL_ORDER = ['东大门', '凯旋门', '中院', '宣怀大道', '包玉刚图书馆', '新行政楼', '仰思坪', '蔷薇园', '思源湖', '电院大草坪'];
    
    locations.sort((a, b) => {
        const idxA = OPTIMAL_ORDER.indexOf(a.name);
        const idxB = OPTIMAL_ORDER.indexOf(b.name);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    container.innerHTML = locations.map((loc, i) => `
        <div class="route-step">
            <div class="route-num">${i + 1}</div>
            <div class="route-info">
                <strong>${loc.name}</strong>
                ${loc.pose ? `<br><span style="color:#e74c3c;">📸 ${loc.pose}</span>` : ''}
            </div>
        </div>
        ${i < locations.length - 1 ? '<div class="route-line"></div>' : ''}
    `).join('');

    // 添加预估时间
    const totalMin = locations.length * 20 + (locations.length - 1) * 10;
    container.innerHTML += `
        <div style="margin-top:12px;padding:12px;background:#fff5e6;border-radius:8px;font-size:13px;">
            🕐 预计总时长：<strong>约 ${totalMin} 分钟</strong>（含拍摄和路程时间）
        </div>
    `;
}

// 地点×姿势说明书 (MediaPipe 辅助拍摄入口)
function renderGuideSection() {
    const container = document.getElementById('result-guide');
    if (!container) return;

    const items = cart.bindings.length > 0 ? cart.bindings : 
        cart.locations.map(l => ({
            locationName: l.name,
            locationId: l.id,
            poseName: cart.poses[0]?.name || '自由发挥',
            poseId: cart.poses[0]?.id || ''
        }));

    if (items.length === 0) {
        container.innerHTML = '<p style="color:#999;">请先在购物车中添加拍摄项目</p>';
        return;
    }

    container.innerHTML = items.map(item => {
        const loc = LOCATIONS.find(l => l.id === item.locationId);
        const pose = POSES.find(p => p.id === item.poseId);
        return `
            <div class="result-guide-card">
                <div class="guide-header">
                    <span class="guide-emoji">${loc ? loc.emoji : '📍'}</span>
                    <span class="guide-title">${item.locationName}</span>
                    <span style="font-size:20px;">×</span>
                    <span class="guide-emoji">${pose ? pose.emoji : '🕺'}</span>
                    <span class="guide-title">${item.poseName}</span>
                </div>
                <div class="guide-body">
                    ${loc ? `<p>📍 ${loc.desc} · 🕐 最佳时间：${loc.bestTime}</p>` : ''}
                    ${pose ? `<p>🕺 ${pose.desc} · 👥 ${pose.people}人</p>` : ''}
                </div>
                <div class="guide-action">
                    <button onclick="openMediaPipeForPose('${item.poseId}')">
                        📸 开启辅助拍摄模式
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function openMediaPipeForPose(poseId) {
    setTargetPose(poseId);
    openMediaPipe();
}

// 复制文案
function copyText(text) {
    const cleanText = text.replace(/\\n/g, '\n');
    if (navigator.clipboard) {
        navigator.clipboard.writeText(cleanText).then(() => {
            showToast('文案已复制到剪贴板');
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = cleanText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('文案已复制到剪贴板');
    }
}

// 保存企划
function savePlan() {
    const planData = {
        cart: cart,
        date: new Date().toISOString(),
        version: '1.0'
    };
    const blob = new Blob([JSON.stringify(planData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '交大毕业照企划_' + new Date().toISOString().slice(0, 10) + '.json';
    link.click();
    URL.revokeObjectURL(url);
    showToast('企划已保存到本地');
}

// 分享企划
function sharePlan() {
    if (navigator.share) {
        navigator.share({
            title: '我的交大毕业照企划',
            text: `我策划了一份交大毕业照拍摄方案，包含${cart.locations.length}个地点和${cart.poses.length}种姿势！`,
        }).catch(() => {});
    } else {
        copyText(`我策划了一份交大毕业照拍摄方案！\n📍 地点：${cart.locations.map(l => l.name).join('、')}\n🕺 姿势：${cart.poses.map(p => p.name).join('、')}\n快来一起拍毕业照吧！`);
        showToast('分享文案已复制，可以粘贴到微信/朋友圈');
    }
}

// ===== 初始化 =====
function init() {
    loadCart();
    updateCartBadge();
    initChat();
    renderRecommendations();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);