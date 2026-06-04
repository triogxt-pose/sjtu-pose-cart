// ===== AI 聊天助手 =====
// 支持本地关键词匹配 和 远程 LLM API 调用

let chatHistory = [];
let chatTypingTimer = null;

function initChat() {
    const sendBtn = document.getElementById('btn-send');
    const input = document.getElementById('chat-input');
    const voiceBtn = document.getElementById('btn-voice');

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
    if (voiceBtn) voiceBtn.addEventListener('click', startVoiceInput);
}

// 快捷发送
function quickSend(text) {
    const input = document.getElementById('chat-input');
    if (input) {
        input.value = text;
        sendMessage();
    }
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;

    addChatMessage('user', msg);
    input.value = '';
    chatHistory.push({ role: 'user', content: msg });

    // 限制历史长度
    if (chatHistory.length > APP_CONFIG.maxChatHistory * 2) {
        chatHistory = chatHistory.slice(-APP_CONFIG.maxChatHistory * 2);
    }

    // 显示思考中
    const typingEl = addChatMessage('ai', '<span class="typing-dots">导购思考中<span>.</span><span>.</span><span>.</span></span>');

    // 判断使用哪种方式
    if (API_CONFIG.llm.enabled && (API_CONFIG.llm.apiKey || API_CONFIG.llm.proxyUrl)) {
        callLLMAPI(msg, typingEl);
    } else {
        // 本地关键词匹配
        chatTypingTimer = setTimeout(() => {
            removeMessage(typingEl);
            localAIResponse(msg);
        }, 800 + Math.random() * 600);
    }
}

function addChatMessage(role, content) {
    const container = document.getElementById('chat-messages');
    if (!container) return null;
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.innerHTML = `<div class="chat-bubble">${content}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

function removeMessage(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
}

// ===== 本地 AI 响应 =====
function localAIResponse(msg) {
    const lower = msg.toLowerCase();
    let detectedPeople = null;
    let detectedStyle = null;

    // 检测人数
    for (const [key, keywords] of Object.entries(AI_KEYWORDS.people)) {
        if (keywords.some(k => lower.includes(k))) {
            detectedPeople = key;
            break;
        }
    }

    // 检测风格
    for (const [key, keywords] of Object.entries(AI_KEYWORDS.style)) {
        if (keywords.some(k => lower.includes(k))) {
            detectedStyle = key;
            break;
        }
    }

    // 筛选推荐
    let recLocations = [...LOCATIONS];
    let recPoses = [...POSES];

    if (detectedPeople) {
        recPoses = recPoses.filter(p => p.people === detectedPeople);
    }
    if (detectedStyle) {
        recLocations = recLocations.filter(l => l.tags.some(t => detectedStyle.includes(t) || t.includes(detectedStyle)));
        recPoses = recPoses.filter(p => p.style === detectedStyle || detectedStyle.includes(p.style));
    }

    // 如果经典照片风格，优先推荐 hasSkeleton 的姿势
    if (detectedStyle === '经典照片') {
        const classicPoses = recPoses.filter(p => p.hasSkeleton);
        const otherPoses = recPoses.filter(p => !p.hasSkeleton);
        recPoses = [...classicPoses, ...otherPoses];
    }

    recLocations = recLocations.slice(0, 3);
    if (recPoses.length === 0) recPoses = POSES.sort(() => Math.random() - 0.5).slice(0, 4);
    recPoses = recPoses.slice(0, 4);

    // 生成回复文本
    let response = '';
    if (detectedPeople && detectedStyle) {
        response = `明白了！<b>${detectedPeople}</b> · <b>${detectedStyle}风</b>，以下是为你的专属推荐 👇`;
    } else if (detectedPeople) {
        response = `好的！${detectedPeople}的阵容，来看看我的推荐 👇`;
    } else if (detectedStyle) {
        response = `${detectedStyle}风是个好选择！来看看我为你搭配的方案 👇`;
    } else {
        response = `好的！关于"${msg.length > 15 ? msg.slice(0, 15) + '...' : msg}"，我推荐以下方案 👇`;
    }

    addChatMessage('ai', response);

    // 地点推荐卡片
    if (recLocations.length > 0) {
        const cardsHtml = recLocations.map(l => `
            <div class="chat-card" onclick="addToCart('location',{id:'${l.id}',name:'${l.name}',emoji:'${l.emoji}'});updateCartBadge();">
                <div class="card-emoji">${l.emoji}</div>
                <div class="card-title">${l.name}</div>
                <div class="card-meta">${l.desc}</div>
                <button class="card-add-btn" onclick="event.stopPropagation();addToCart('location',{id:'${l.id}',name:'${l.name}',emoji:'${l.emoji}'});updateCartBadge();">🛒 加购</button>
            </div>
        `).join('');
        addChatMessage('ai', `<div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">📍 推荐地点：</div><div class="chat-card-wrap">${cardsHtml}</div>`);
    }

    // 姿势推荐卡片
    if (recPoses.length > 0) {
        const cardsHtml = recPoses.map(p => `
            <div class="chat-card" onclick="addToCart('pose',{id:'${p.id}',name:'${p.name}',emoji:'${p.emoji}',hasSkeleton:${p.hasSkeleton||false}});updateCartBadge();">
                <div class="card-emoji">${p.emoji}</div>
                <div class="card-title">${p.name}</div>
                <div class="card-meta">${p.people}人 · ${p.style}${p.hasSkeleton ? ' · 📸AI比对' : ''}</div>
                <button class="card-add-btn" onclick="event.stopPropagation();addToCart('pose',{id:'${p.id}',name:'${p.name}',emoji:'${p.emoji}',hasSkeleton:${p.hasSkeleton||false}});updateCartBadge();">🛒 加购</button>
            </div>
        `).join('');
        addChatMessage('ai', `<div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">🕺 推荐姿势：</div><div class="chat-card-wrap">${cardsHtml}</div>`);
    }

    // 如果有老照片姿势，追加提示
    if (recPoses.some(p => p.hasSkeleton)) {
        addChatMessage('ai', '💡 小提示：标记了"📸AI比对"的姿势，可以在订单交付页使用 AI 姿势比对功能，帮你拍出复刻级老照片哦！');
    }

    // 结尾俏皮话
    const closings = [
        '喜欢就加购吧～点击卡片即可放入购物车 🛒',
        '心动不如行动，加购后可以去购物车自由组合哦！',
        '这些推荐还满意吗？可以继续告诉我更多需求～',
        '相中哪个就点"加购"，像逛淘宝一样轻松！',
        '选好了就去购物车组合吧，AI 帮你规划路线 🗺️'
    ];
    addChatMessage('ai', closings[Math.floor(Math.random() * closings.length)]);
}

// ===== 远程 LLM API 调用 =====
async function callLLMAPI(msg, typingEl) {
    try {
        // 判断使用代理模式还是直接调用
        const useProxy = !!API_CONFIG.llm.proxyUrl;
        const apiUrl = useProxy
            ? `${API_CONFIG.llm.proxyUrl}/api/chat/completions`
            : `${API_CONFIG.llm.baseUrl}/chat/completions`;

        const headers = { 'Content-Type': 'application/json' };
        // 直接调用模式需要 Authorization 头，代理模式由 Worker 添加
        if (!useProxy) {
            headers['Authorization'] = `Bearer ${API_CONFIG.llm.apiKey}`;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: API_CONFIG.llm.model,
                messages: [
                    { role: 'system', content: API_CONFIG.llm.systemPrompt },
                    ...chatHistory.slice(-10)
                ],
                temperature: API_CONFIG.llm.temperature,
                max_tokens: API_CONFIG.llm.maxTokens
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        removeMessage(typingEl);

        if (data.choices && data.choices[0]) {
            const aiMsg = data.choices[0].message.content;
            addChatMessage('ai', aiMsg);
            chatHistory.push({ role: 'assistant', content: aiMsg });
        }
    } catch (error) {
        removeMessage(typingEl);
        if (APP_CONFIG.debug) {
            console.warn('LLM API 调用失败，降级为本地模式:', error.message);
        }
        localAIResponse(msg);
    }
}

// ===== AI 文案生成 =====
async function generateAICopyText(locations, poses, style) {
    // 如果启用了远程API，尝试调用
    if (API_CONFIG.copyGen.enabled && (API_CONFIG.copyGen.apiKey || API_CONFIG.copyGen.proxyUrl)) {
        try {
            const locNames = locations.map(l => l.name || l.locationName).join('、');
            const poseNames = poses.map(p => p.name || p.poseName).join('、');

            const useProxy = !!API_CONFIG.copyGen.proxyUrl;
            const apiUrl = useProxy
                ? `${API_CONFIG.copyGen.proxyUrl}/api/chat/completions`
                : `${API_CONFIG.copyGen.baseUrl}/chat/completions`;

            const headers = { 'Content-Type': 'application/json' };
            if (!useProxy) {
                headers['Authorization'] = `Bearer ${API_CONFIG.copyGen.apiKey}`;
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: API_CONFIG.copyGen.model,
                    messages: [
                        { role: 'system', content: API_CONFIG.copyGen.systemPrompt },
                        { role: 'user', content: `拍摄地点：${locNames}\n拍摄姿势：${poseNames}\n偏好风格：${style || 'all'}` }
                    ],
                    temperature: API_CONFIG.copyGen.temperature,
                    max_tokens: API_CONFIG.copyGen.maxTokens
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content;
            }
        } catch (e) {
            if (APP_CONFIG.debug) {
                console.warn('文案生成API调用失败，使用本地模板:', e.message);
            }
        }
    }
    return null; // 返回 null 表示使用本地模板
}

// ===== 语音输入 =====
function startVoiceInput() {
    const voiceBtn = document.getElementById('btn-voice');

    // 优先使用浏览器内置 Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = API_CONFIG.speech.lang || 'zh-CN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        voiceBtn.classList.add('recording');
        showToast('正在聆听...');

        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById('chat-input');
            if (input) input.value = transcript;
            voiceBtn.classList.remove('recording');
            showToast(`识别结果：${transcript}`);
            sendMessage();
        };

        recognition.onerror = (event) => {
            voiceBtn.classList.remove('recording');
            if (event.error === 'not-allowed') {
                showToast('请在浏览器设置中允许麦克风权限');
            } else if (event.error === 'no-speech') {
                showToast('未检测到语音，请重试');
            } else {
                showToast('语音识别失败，请使用文字输入');
            }
        };

        recognition.onend = () => {
            voiceBtn.classList.remove('recording');
        };
        return;
    }

    // 降级方案：提示用户
    showToast('当前浏览器不支持语音输入，请使用文字输入');
}