// =============================================================================

// 本地 API 配置模板
// =============================================================================
// 将此文件重命名为 config.local.js 并填入真实 API 密钥
// 该文件已在 .gitignore 中排除，不会被提交到版本控制
//
// 使用方式：
//   1. 复制此文件为 js/config.local.js
//   2. 填入真实的 API 密钥
//   3. 在 index.html 中引入：<script src="js/config.local.js"></script>
//      注意：config.local.js 必须在 config.js 之前加载
// =============================================================================

const LOCAL_API_CONFIG = {
    // ===== 大语言模型 API =====
    llm: {
        enabled: false,             // 设为 true 启用真实 LLM API
        apiKey: '你的API密钥',       // 填入你的 API Key
        baseUrl: 'https://models.sjtu.edu.cn/api/v1',
        model: 'minimax',
        maxTokens: 600,
        temperature: 0.7
    },

    // ===== 文案生成 API =====
    copyGen: {
        enabled: false,             // 设为 true 启用远程文案生成
        apiKey: '你的API密钥',       // 填入你的 API Key
        baseUrl: 'https://models.sjtu.edu.cn/api/v1',
        model: 'minimax',
        maxTokens: 500,
        temperature: 0.85
    },

    // ===== 语音识别 API（可选） =====
    speech: {
        enabled: true,
        useBrowserAPI: true,        // 使用浏览器内置语音识别，无需 API Key
        lang: 'zh-CN'
    },

    // ===== 路线规划 API（可选） =====
    routePlan: {
        enabled: false,
        apiKey: '',
        baseUrl: ''
    }
};