// ===== 购物车管理 =====

let cart = {
    locations: [],  // { id, name, emoji }
    poses: [],      // { id, name, emoji, hasSkeleton }
    bindings: []    // { poseId, poseName, locationId, locationName }
};

function loadCart() {
    const saved = localStorage.getItem('sjtu_photo_cart');
    if (saved) {
        try { cart = JSON.parse(saved); } catch (e) { resetCart(); }
    }
}

function saveCart() {
    localStorage.setItem('sjtu_photo_cart', JSON.stringify(cart));
    updateCartBadge();
}

function resetCart() {
    cart = { locations: [], poses: [], bindings: [] };
    saveCart();
}

function addToCart(type, item) {
    if (type === 'location') {
        if (!cart.locations.find(l => l.id === item.id)) {
            cart.locations.push({ id: item.id, name: item.name, emoji: item.emoji || '📍' });
            saveCart();
            showToast(`已添加地点：${item.name}`);
        } else {
            showToast('该地点已在购物车中');
        }
    } else if (type === 'pose') {
        if (!cart.poses.find(p => p.id === item.id)) {
            cart.poses.push({
                id: item.id, name: item.name, emoji: item.emoji || '🕺',
                hasSkeleton: item.hasSkeleton || false
            });
            saveCart();
            showToast(`已添加姿势：${item.name}`);
        } else {
            showToast('该姿势已在购物车中');
        }
    }
}

function removeFromCart(type, id) {
    if (type === 'location') {
        cart.locations = cart.locations.filter(l => l.id !== id);
        cart.bindings = cart.bindings.filter(b => b.locationId !== id);
    } else if (type === 'pose') {
        cart.poses = cart.poses.filter(p => p.id !== id);
        cart.bindings = cart.bindings.filter(b => b.poseId !== id);
    }
    saveCart();
}

function addBinding(poseId, locationId) {
    const pose = cart.poses.find(p => p.id === poseId);
    const location = cart.locations.find(l => l.id === locationId);
    if (!pose || !location) return;

    if (!cart.bindings.find(b => b.poseId === poseId && b.locationId === locationId)) {
        cart.bindings.push({
            poseId, poseName: pose.name,
            locationId, locationName: location.name
        });
        saveCart();
        showToast(`已绑定：${pose.name} → ${location.name}`);
    }
}

function removeBinding(poseId, locationId) {
    cart.bindings = cart.bindings.filter(b => !(b.poseId === poseId && b.locationId === locationId));
    saveCart();
}

function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (badge) {
        const total = cart.locations.length + cart.poses.length;
        badge.textContent = total;
    }
}

function renderCartPage() {
    const poseList = document.getElementById('cart-poses-list');
    const locList = document.getElementById('cart-locations-list');
    const bindingsList = document.getElementById('bindings-list');
    const locCount = document.getElementById('cart-location-count');
    const poseCount = document.getElementById('cart-pose-count');

    if (locCount) locCount.textContent = cart.locations.length;
    if (poseCount) poseCount.textContent = cart.poses.length;

    // 姿势列表
    if (poseList) {
        poseList.innerHTML = cart.poses.map(p => `
            <div class="cart-mini-item" draggable="true" data-pose-id="${p.id}">
                <span class="item-emoji">${p.emoji}</span>
                <span>${p.name}</span>
                <button class="item-remove" onclick="event.stopPropagation(); removeFromCart('pose', '${p.id}'); renderCartPage();">✕</button>
            </div>
        `).join('');
        if (cart.poses.length === 0) {
            poseList.innerHTML = '<div style="color:#999;font-size:12px;text-align:center;padding:20px;">暂无姿势</div>';
        }
    }

    // 地点列表
    if (locList) {
        locList.innerHTML = cart.locations.map(l => `
            <div class="cart-mini-item" data-location-id="${l.id}"
                 ondragover="event.preventDefault()"
                 ondrop="handleDrop(event, '${l.id}')">
                <span class="item-emoji">${l.emoji}</span>
                <span>${l.name}</span>
                <button class="item-remove" onclick="event.stopPropagation(); removeFromCart('location', '${l.id}'); renderCartPage();">✕</button>
            </div>
        `).join('');
        if (cart.locations.length === 0) {
            locList.innerHTML = '<div style="color:#999;font-size:12px;text-align:center;padding:20px;">暂无地点</div>';
        }
    }

    // 绑定列表
    if (bindingsList) {
        bindingsList.innerHTML = cart.bindings.map(b => `
            <div class="binding-item">
                <span>${b.poseName}</span>
                <span class="bind-arrow">→</span>
                <span>${b.locationName}</span>
                <button class="item-remove" onclick="removeBinding('${b.poseId}', '${b.locationId}'); renderCartPage();">✕</button>
            </div>
        `).join('');
        if (cart.bindings.length === 0) {
            bindingsList.innerHTML = '<div style="color:#999;font-size:12px;text-align:center;padding:20px;">拖拽姿势到地点进行绑定，或点击"AI自动组合"</div>';
        }
    }

    // 设置拖拽
    setupDragAndDrop();
}

function setupDragAndDrop() {
    document.querySelectorAll('.cart-mini-item[draggable]').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.dataset.poseId);
            item.style.opacity = '0.5';
        });
        item.addEventListener('dragend', (e) => {
            item.style.opacity = '1';
        });
    });
}

function handleDrop(e, locationId) {
    e.preventDefault();
    const poseId = e.dataTransfer.getData('text/plain');
    if (poseId && locationId) {
        addBinding(poseId, locationId);
        renderCartPage();
    }
}

// AI自动绑定
function aiAutoBind() {
    if (cart.poses.length === 0 || cart.locations.length === 0) {
        showToast('请先添加至少一个地点和一个姿势');
        return;
    }
    cart.bindings = [];
    cart.poses.forEach((pose, i) => {
        const loc = cart.locations[i % cart.locations.length];
        cart.bindings.push({
            poseId: pose.id, poseName: pose.name,
            locationId: loc.id, locationName: loc.name
        });
    });
    saveCart();
    renderCartPage();
    showToast('AI 已自动组合完成！');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 2000);
}

loadCart();