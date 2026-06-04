// =============================================================================
// 本地 API 配置模板
// =============================================================================
// 将此文件重命名为 config.local.js 并填入真实 API 密钥
// 该文件已在 .gitignore 中排除，不会被提交到版本控制
//
// 使用方式：
//   1. 复制此文件为 js/config.local.js
//   2. 填入真实的 API 密钥或 Worker 代理地址
//   3. 在 index.html 中引入：<script src="js/config.local.js"></script>
//      注意：config.local.js 必须在 config.js 之前加载
//
// 两种模式任选其一：
//   【模式一】本地开发：填入 apiKey 和 baseUrl，直接调用 API
//   【模式二】线上部署：部署 Cloudflare Worker 代理后，填入 proxyUrl
//             （推荐，API 密钥不会暴露在前端代码中）
// =============================================================================

const LOCAL_API_CONFIG = {
    // ===== 大语言模型 API =====
    llm: {
        enabled: false,             // 设为 true 启用真实 LLM API

        // ---- 模式一：本地直接调用 ----
        apiKey: '你的API密钥',       // 填入你的 API Key
        baseUrl: 'https://你的API地址/api/v1',

        // ---- 模式二：Cloudflare Worker 代理（线上部署）⭐ 推荐 ----
        // 部署 Worker 后，取消下面注释并填入 Worker 地址
        // 使用代理模式时，上面的 apiKey 和 baseUrl 可以留空
        // proxyUrl: 'https://sjtu-pose-cart-api.你的用户名.workers.dev',

        model: 'minimax',
        maxTokens: 1000,
        temperature: 0.7
    },

    // ===== 文案生成 API =====
    copyGen: {
        enabled: false,             // 设为 true 启用远程文案生成

        // ---- 模式一：本地直接调用 ----
        apiKey: '你的API密钥',       // 填入你的 API Key
        baseUrl: 'https://你的API地址/api/v1',

        // ---- 模式二：Cloudflare Worker 代理（线上部署）⭐ 推荐 ----
        // proxyUrl: 'https://sjtu-pose-cart-api.你的用户名.workers.dev',

        model: 'minimax',
        maxTokens: 1000,
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