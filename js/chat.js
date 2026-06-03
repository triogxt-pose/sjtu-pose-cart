// ===== AI 聊天助手 =====

// TODO: 替换为实际的LLM API密钥和端点
const LLM_CONFIG = {
    apiKey: 'sk-W2fWqhpuiq5MvwSwaauUYg',     // 请替换为你的 API Key
    baseUrl: 'https://models.sjtu.edu.cn/api/v1',  // SJTU 模型平台
    model: 'minimax',
    enabled: true  // 设为 true 启用真实 API 调用
};

// 语音识别配置
const SPEECH_CONFIG = {
    enabled: true,
    lang: 'zh-CN'
};

let chatHistory = [];

function initChat() {
    const sendBtn = document.getElementById('btn-send');
    const input = document.getElementById('chat-input');
    const voiceBtn = document.getElementById('btn-voice');

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    if (voiceBtn) voiceBtn.addEventListener('click', startVoiceInput);
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    addChatMessage('user', msg);
    input.value = '';
    chatHistory.push({ role: 'user', content: msg });

    // 模拟AI思考延迟
    const typingEl = addChatMessage('ai', '正在思考...');
    
    if (LLM_CONFIG.enabled && LLM_CONFIG.apiKey !== 'YOUR_API_KEY_HERE') {
        callLLMAPI(msg, typingEl);
    } else {
        // 本地关键词匹配（离线模式）
        setTimeout(() => {
            removeMessage(typingEl);
            localAIResponse(msg);
        }, 800 + Math.random() * 1200);
    }
}

function addChatMessage(role, content) {
    const container = document.getElementById('chat-messages');
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

// 本地AI响应（关键词匹配 + 推荐卡片）
function localAIResponse(msg) {
    const lower = msg.toLowerCase();
    let response = '';

    // 检测人数
    let detectedPeople = null;
    for (const [key, keywords] of Object.entries(AI_KEYWORDS.people)) {
        if (keywords.some(k => lower.includes(k))) {
            detectedPeople = key;
            break;
        }
    }

    // 检测风格
    let detectedStyle = null;
    for (const [key, keywords] of Object.entries(AI_KEYWORDS.style)) {
        if (keywords.some(k => lower.includes(k))) {
            detectedStyle = key;
            break;
        }
    }

    // 推荐地点 (随机推荐3个)
    let recLocations = [...LOCATIONS];
    if (detectedStyle) {
        recLocations = recLocations.filter(l => l.tags.some(t => 
            t === detectedStyle || detectedStyle.includes(t)
        ));
    }
    recLocations = recLocations.slice(0, 3);

    // 推荐姿势
    let recPoses = [...POSES];
    if (detectedPeople) {
        recPoses = recPoses.filter(p => p.people === detectedPeople);
    }
    if (detectedStyle) {
        recPoses = recPoses.filter(p => p.style === detectedStyle || 
            p.style === detectedStyle.replace('浪漫','浪漫').replace('活泼','活泼'));
    }
    recPoses = recPoses.slice(0, 3);

    if (recLocations.length === 0 && recPoses.length === 0) {
        response = `好的！关于"${msg}"，我建议你可以试试：<br><br>
            🏛️ <b>经典路线</b>：东大门 → 中院 → 宣怀大道 → 思源湖<br>
            🎭 <b>创意路线</b>：蔷薇园 → 仰思坪 → 新行政楼<br><br>
            想要什么风格的推荐呢？试试告诉我"几个人"和"想要什么风格"吧！`;
    } else {
        if (detectedPeople || detectedStyle) {
            response = `明白了！${detectedPeople ? detectedPeople : ''}${detectedStyle ? ' · ' + detectedStyle + '风' : ''}，以下是为你的推荐：`;
        } else {
            response = `好的！以下是我的推荐：`;
        }
    }

    addChatMessage('ai', response);

    // 在地点栏下方插入地点推荐卡片
    if (recLocations.length > 0) {
        const cardsHtml = recLocations.map(l => `
            <div class="card-item">
                <div class="card-img">${l.emoji}</div>
                <div class="card-name">${l.name}</div>
                <div class="card-meta">${l.desc}</div>
                <button class="card-add-btn" onclick="addToCart('location', {id:'${l.id}',name:'${l.name}',emoji:'${l.emoji}'});updateCartBadge();">
                    🛒 加入购物车
                </button>
            </div>
        `).join('');
        addChatMessage('ai', `<div class="rec-cards" style="flex-wrap:wrap;gap:10px;">${cardsHtml}</div>`);
    }

    // 在姿势栏下方插入姿势推荐卡片
    if (recPoses.length > 0) {
        const cardsHtml = recPoses.map(p => `
            <div class="card-item">
                <div class="card-img">${p.emoji}</div>
                <div class="card-name">${p.name}</div>
                <div class="card-meta">${p.people}人 · ${p.style}</div>
                <button class="card-add-btn" onclick="addToCart('pose', {id:'${p.id}',name:'${p.name}',emoji:'${p.emoji}',hasSkeleton:${p.hasSkeleton||false}});updateCartBadge();">
                    🛒 加入购物车
                </button>
            </div>
        `).join('');
        addChatMessage('ai', `<div class="rec-cards" style="flex-wrap:wrap;gap:10px;">${cardsHtml}</div>`);
    }
}

// 调用真实LLM API（参考 Gradio-YOLO-LLM 的写法）
async function callLLMAPI(msg, typingEl) {
    try {
        const response = await fetch(`${LLM_CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LLM_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: LLM_CONFIG.model,
                messages: [
                    { role: 'system', content: '你是交大毕业照策划助手。根据用户提供的人数和风格，推荐拍摄地点和姿势。回复要简洁有趣，像网购导购一样。' },
                    ...chatHistory
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });

        const data = await response.json();
        removeMessage(typingEl);
        
        if (data.choices && data.choices[0]) {
            const aiMsg = data.choices[0].message.content;
            addChatMessage('ai', aiMsg);
            chatHistory.push({ role: 'assistant', content: aiMsg });
        }
    } catch (error) {
        removeMessage(typingEl);
        console.error('LLM API 调用失败:', error);
        localAIResponse(msg);
    }
}

// 语音输入
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('当前浏览器不支持语音输入');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_CONFIG.lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const voiceBtn = document.getElementById('btn-voice');
    voiceBtn.textContent = '🔴';
    voiceBtn.style.background = '#e74c3c';
    voiceBtn.style.color = 'white';
    showToast('正在聆听...');

    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('chat-input').value = transcript;
        voiceBtn.textContent = '🎤';
        voiceBtn.style.background = '';
        voiceBtn.style.color = '';
        showToast(`识别结果：${transcript}`);
        sendMessage();
    };

    recognition.onerror = () => {
        voiceBtn.textContent = '🎤';
        voiceBtn.style.background = '';
        voiceBtn.style.color = '';
        showToast('语音识别失败，请重试');
    };

    recognition.onend = () => {
        voiceBtn.textContent = '🎤';
        voiceBtn.style.background = '';
        voiceBtn.style.color = '';
    };
}
