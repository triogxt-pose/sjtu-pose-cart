// =============================================================================
// API 配置文件
// =============================================================================
// 所有 API 密钥集中管理，不裸露在业务代码中
// 生产环境部署时，通过环境变量或后端接口注入真实的 API 密钥
// 复制 config.local.example.js 为 config.local.js 并填入真实 API 密钥
// config.local.js 已在 .gitignore 中排除，不会提交到版本控制
// =============================================================================

const API_CONFIG = {
    // ===== LLM 对话 API（用于 AI 聊天助手） =====
    llm: {
        enabled: false,              // 是否启用远程 API（false 时使用本地关键词匹配）
        apiKey: process.env.
        API_KEY_LLM || '',
        baseUrl: 'https://models.sjtu.edu.cn/api/v1',
        model: 'minimax',
        maxTokens: 1000,
        temperature: 0.7,
        // 系统提示词
        systemPrompt: `你是"交大毕业照购物车"的 AI 导购助手，名叫"小交"。你的角色是：
1. 热情、有趣、像淘宝导购一样帮用户推荐毕业照拍摄方案
2. 根据用户告知的人数（1人/2人/3-5人/6+人）、风格偏好（经典/浪漫/搞笑/文艺/老照片），推荐 3 个地点 + 3 个姿势
3. 回复格式：先简短问候，再逐条列出推荐，每条用 [卡片:type:id] 格式标记
   - 地点卡片：[卡片:location:loc1]
   - 姿势卡片：[卡片:pose:pose1]
4. 回复末尾加上一句俏皮话鼓励用户加购
5. 如果用户问"老照片"，重点推荐 hasSkeleton 的姿势，并告知可以在订单交付页使用 AI 姿势比对
6. 回复中不要出现任何 markdown 格式，保持简洁口语化
7. 如果用户问人数，给出适合该人数的姿势推荐；如果用户问风格，给出对应风格的地点推荐`
    },

    // ===== 文案生成 API（用于生成朋友圈文案） =====
    copyGen: {
        enabled: false,              // 是否启用远程 API（false 时使用本地模板）
        apiKey: process.env.
        API_KEY_COPYGEN || '',
        baseUrl: 'https://models.sjtu.edu.cn/api/v1',
        model: 'minimax',
        maxTokens: 1000,
        temperature: 0.85,
        systemPrompt: `你是交大毕业照文案生成器。根据用户选择的地点、姿势和风格，生成 3 段不同风格的朋友圈文案：
1. 💌 深情风：感性、怀旧、有文学感，适合表达对校园时光的不舍与感恩
2. 🎭 搞怪风：幽默、接地气、网感强，适合年轻人搞笑分享
3. 📋 正经风：简洁正式、适合配正式合影，体现交大校训精神
每段文案 80-150 字，用换行分隔，格式：风格名\n文案内容`
    },

    // ===== 语音识别配置 =====
    speech: {
        enabled: true,
        useBrowserAPI: true,         // 优先使用浏览器内置 Web Speech API
        lang: 'zh-CN',
        // 备用：如需使用第三方语音识别 API，在此配置
        // apiKey: '',
        // baseUrl: ''
    },

    // ===== 路线规划 API（可选，用于智能路线优化） =====
    routePlan: {
        enabled: false,              // 是否启用远程路线规划 API
        apiKey: '',
        baseUrl: '',
        // 交大校园各地点坐标（已内置在 data.js 中，此处仅作备用）
    }
};

// =============================================================================
// 应用全局配置
// =============================================================================
const APP_CONFIG = {
    appName: '交大毕业照购物车',
    version: '2.0.0',
    primaryColor: '#005199',
    accentColor: '#FBC412',
    maxCartItems: 20,               // 购物车最大容量
    maxChatHistory: 20,             // 对话历史最大条数
    enableMockAI: true,             // 是否启用本地模拟 AI（离线模式）
    enableDragDrop: true,           // 是否启用拖拽绑定
    enableVoiceInput: true,         // 是否启用语音输入
    enableMediaPipe: true,          // 是否启用 MediaPipe 姿势比对
    enableCoverVideo: true,         // 是否启用封面视频背景
    loadingTimeout: 5000,           // 加载超时时间(ms)
    toastDuration: 2000,            // Toast 显示时长(ms)
    cartStorageKey: 'sjtu_photo_cart_v2', // 本地存储 key
    debug: false                    // 是否开启调试模式
};

// =============================================================================
// 尝试加载本地配置覆盖（从 config.local.js 动态注入）
// =============================================================================
(function loadLocalConfig() {
    if (typeof LOCAL_API_CONFIG !== 'undefined') {
        // 深度合并，避免覆盖整个对象
        if (LOCAL_API_CONFIG.llm) {
            Object.assign(API_CONFIG.llm, LOCAL_API_CONFIG.llm);
        }
        if (LOCAL_API_CONFIG.copyGen) {
            Object.assign(API_CONFIG.copyGen, LOCAL_API_CONFIG.copyGen);
        }
        if (LOCAL_API_CONFIG.speech) {
            Object.assign(API_CONFIG.speech, LOCAL_API_CONFIG.speech);
        }
        if (LOCAL_API_CONFIG.routePlan) {
            Object.assign(API_CONFIG.routePlan, LOCAL_API_CONFIG.routePlan);
        }
        if (APP_CONFIG.debug) {
            console.log('[Config] 本地配置已加载');
        }
    }
})();