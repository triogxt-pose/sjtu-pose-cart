// =============================================================================
// Cloudflare Worker - API 代理
// =============================================================================
// 作用：作为前端和 LLM API 之间的安全代理层
// 前端不持有 API 密钥，密钥存储在 Cloudflare Worker 的环境变量中
//
// 部署方式：
//   1. npm install -g wrangler
//   2. wrangler login
//   3. wrangler secret put API_KEY          # 设置你的 API 密钥
//   4. wrangler secret put API_BASE_URL     # 设置 API 地址
//   5. wrangler deploy
//
// 前端调用方式：
//   fetch('https://your-worker.workers.dev/api/chat', { ... })
// =============================================================================

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // CORS 预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400',
                }
            });
        }

        // 只处理 /api/ 路径的请求
        if (!url.pathname.startsWith('/api/')) {
            return new Response('Not Found', { status: 404 });
        }

        // 获取目标 API 路径
        const apiPath = url.pathname.replace('/api', '');
        const apiBaseUrl = env.API_BASE_URL || 'https://models.sjtu.edu.cn/api/v1';
        const targetUrl = `${apiBaseUrl}${apiPath}`;

        try {
            // 构建转发请求
            const headers = new Headers(request.headers);

            // 注入 API 密钥（服务端持有，前端不暴露）
            headers.set('Authorization', `Bearer ${env.API_KEY}`);
            headers.set('Content-Type', 'application/json');

            // 移除可能从前端传来的伪造 Authorization
            // 确保只使用服务端的 API_KEY

            const body = request.method === 'GET' ? null : await request.text();

            const proxyRequest = new Request(targetUrl, {
                method: request.method,
                headers: headers,
                body: body || undefined,
            });

            // 转发请求到真实 API
            const response = await fetch(proxyRequest);
            const responseBody = await response.text();

            // 返回响应，添加 CORS 头
            return new Response(responseBody, {
                status: response.status,
                statusText: response.statusText,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Cache-Control': 'no-cache',
                }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                error: 'API 代理请求失败',
                message: error.message
            }), {
                status: 502,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            });
        }
    }
};