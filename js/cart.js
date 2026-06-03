// ===== 购物车管理 =====
// 支持本地存储持久化、拖拽绑定、随机组合、复选框批量删除

const CART_KEY = APP_CONFIG.cartStorageKey || 'sjtu_photo_cart_v2';
let cartItems = { locations: [], poses: [] };
let cartBindings = {}; // { locationId: [poseId1, poseId2, ...] }

function initCart() {
    loadCart();
    const clearBtn = document.getElementById('btn-clear-cart');
    if (clearBtn) clearBtn.addEventListener('click', clearCart);
}

function loadCart() {
    try {
        const saved = localStorage.getItem(CART_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            cartItems = data.items || { locations: [], poses: [] };
            cartBindings = data.bindings || {};
        }
    } catch (e) {
        console.warn('购物车数据加载失败');
    }
}

function saveCart() {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify({
            items: cartItems,
            bindings: cartBindings
        }));
    } catch (e) {
        console.warn('购物车存储空间不足');
    }
}

// 添加到购物车
function addToCart(type, item) {
    const list = cartItems[type === 'location' ? 'locations' : 'poses'];
    // 检查是否已存在
    if (list.some(i => i.id === item.id)) {
        showToast('已在购物车中');
        return;
    }
    list.push(item);
    saveCart();
    updateCartBadge();
    showToast('已加入购物车 🛒');
}

// 从购物车移除
function removeFromCart(type, id) {
    const key = type === 'location' ? 'locations' : 'poses';
    cartItems[key] = cartItems[key].filter(i => i.id !== id);
    // 清除相关绑定
    if (type === 'location') {
        delete cartBindings[id];
    }
    if (type === 'pose') {
        Object.keys(cartBindings).forEach(locId => {
            cartBindings[locId] = cartBindings[locId].filter(pid => pid !== id);
        });
    }
    saveCart();
    updateCartBadge();
    renderCart();
    showToast('已移除');
}

// 清空购物车
function clearCart() {
    if (cartItems.locations.length === 0 && cartItems.poses.length === 0) {
        showToast('购物车已经是空的');
        return;
    }
    if (confirm('确定要清空购物车吗？')) {
        cartItems = { locations: [], poses: [] };
        cartBindings = {};
        saveCart();
        updateCartBadge();
        renderCart();
        showToast('购物车已清空');
    }
}

// 更新购物车角标
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const badge2 = document.getElementById('cart-badge-2');
    const total = cartItems.locations.length + cartItems.poses.length;
    if (badge) {
        badge.textContent = total;
        badge.style.display = total > 0 ? 'flex' : 'none';
    }
    if (badge2) {
        badge2.textContent = total;
        badge2.style.display = total > 0 ? 'flex' : 'none';
    }
}

// 渲染购物车页面
function renderCart() {
    // 渲染位置列表
    const locList = document.getElementById('cart-locations-list');
    const poseList = document.getElementById('cart-poses-list');
    const bindingList = document.getElementById('binding-list');
    const locCount = document.getElementById('loc-col-count');
    const poseCount = document.getElementById('pose-col-count');

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
        if (locCount) locCount.textContent = cartItems.locations.length;
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
        if (poseCount) poseCount.textContent = cartItems.poses.length;
    }

    // 渲染绑定列表
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
                <span>→</span>
                <span>🕺 ${b.poseName}</span>
                <span class="binding-unlink" onclick="unbindCartItem('${b.locId}','${b.poseId}')">✕</span>
            </div>
        `).join('');
    }

    // 更新空状态
    const cartEmpty = document.getElementById('cart-empty');
    const cartContent = document.getElementById('cart-content');
    const total = cartItems.locations.length + cartItems.poses.length;
    if (cartEmpty && cartContent) {
        cartEmpty.style.display = total === 0 ? 'flex' : 'none';
        cartContent.style.display = total > 0 ? 'block' : 'none';
    }
}

// 复选框切换
function toggleCartCheck(el) {
    if (el.textContent === '☐') {
        el.textContent = '☑';
        el.classList.add('checked');
    } else {
        el.textContent = '☐';
        el.classList.remove('checked');
    }
}

// 批量删除选中项
function batchDeleteChecked() {
    const locList = document.getElementById('cart-locations-list');
    const poseList = document.getElementById('cart-poses-list');

    const checkedLocs = locList ? locList.querySelectorAll('.cart-item-check.checked') : [];
    const checkedPoses = poseList ? poseList.querySelectorAll('.cart-item-check.checked') : [];

    if (checkedLocs.length === 0 && checkedPoses.length === 0) {
        showToast('请先勾选要删除的项目');
        return;
    }

    const locIds = Array.from(checkedLocs).map(cb => cb.closest('.cart-item').dataset.id);
    const poseIds = Array.from(checkedPoses).map(cb => cb.closest('.cart-item').dataset.id);

    locIds.forEach(id => removeFromCart('location', id));
    poseIds.forEach(id => removeFromCart('pose', id));

    showToast(`已删除 ${locIds.length + poseIds.length} 个项目`);
}

// 拖拽绑定
let cartDragData = null;

function cartDragStart(e) {
    cartDragData = {
        type: e.target.dataset.type,
        id: e.target.dataset.id,
        name: e.target.dataset.name
    };
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function cartDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.target.closest('.cart-item')?.classList.add('drag-over');
}

function cartDragLeave(e) {
    e.target.closest('.cart-item')?.classList.remove('drag-over');
}

function cartDrop(e) {
    e.preventDefault();
    const target = e.target.closest('.cart-item');
    if (target) target.classList.remove('drag-over');

    if (!cartDragData) return;

    const targetType = target?.dataset.type;
    const targetId = target?.dataset.id;

    // 姿势拖到地点上 → 绑定
    if (cartDragData.type === 'pose' && targetType === 'location') {
        bindCartItem(targetId, cartDragData.id);
    }
    // 地点拖到姿势上 → 绑定
    else if (cartDragData.type === 'location' && targetType === 'pose') {
        bindCartItem(cartDragData.id, targetId);
    }

    cartDragData = null;
}

// 绑定姿势到地点
function bindCartItem(locationId, poseId) {
    if (!cartBindings[locationId]) {
        cartBindings[locationId] = [];
    }
    if (cartBindings[locationId].includes(poseId)) {
        showToast('已绑定过该姿势');
        return;
    }
    cartBindings[locationId].push(poseId);
    saveCart();
    renderCart();
    const pose = cartItems.poses.find(p => p.id === poseId);
    const loc = cartItems.locations.find(l => l.id === locationId);
    showToast(`"${pose?.name}" → "${loc?.name}" 绑定成功`);
}

// 解除绑定
function unbindCartItem(locationId, poseId) {
    if (cartBindings[locationId]) {
        cartBindings[locationId] = cartBindings[locationId].filter(id => id !== poseId);
    }
    saveCart();
    renderCart();
    showToast('已解除绑定');
}

// 随机组合
function randomBind() {
    const locs = cartItems.locations;
    const poses = cartItems.poses;

    if (locs.length === 0 || poses.length === 0) {
        showToast('请先添加至少一个地点和一个姿势');
        return;
    }

    // 清空原有绑定
    cartBindings = {};

    // 随机分配：每个地点至少一个姿势
    const shuffledPoses = [...poses].sort(() => Math.random() - 0.5);
    locs.forEach((loc, i) => {
        cartBindings[loc.id] = [shuffledPoses[i % shuffledPoses.length].id];
    });

    // 剩余姿势随机追加
    const usedCount = locs.length;
    for (let i = usedCount; i < shuffledPoses.length; i++) {
        const randomLoc = locs[Math.floor(Math.random() * locs.length)];
        if (!cartBindings[randomLoc.id].includes(shuffledPoses[i].id)) {
            cartBindings[randomLoc.id].push(shuffledPoses[i].id);
        }
    }

    saveCart();
    renderCart();
    showToast('随机组合完成！🎉');
}

// 获取购车数据（供订单页使用）
function getCartData() {
    return {
        locations: [...cartItems.locations],
        poses: [...cartItems.poses],
        bindings: { ...cartBindings }
    };
}

// 获取有绑定的地点列表（用于订单页）
function getBoundLocations() {
    const boundLocIds = Object.keys(cartBindings).filter(id => cartBindings[id].length > 0);
    return boundLocIds.map(locId => {
        const loc = cartItems.locations.find(l => l.id === locId);
        const poses = cartBindings[locId].map(pid => cartItems.poses.find(p => p.id === pid)).filter(Boolean);
        return { ...loc, poses };
    });
}