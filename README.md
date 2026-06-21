# AI1202 人工智能基础 小组大作业

## 交大毕业照购物车——毕业季拍摄企划

一个专为上海交大毕业生设计的移动端Web应用，帮助规划毕业照拍摄路线和姿势。

---

### 课程技术应用

本项目综合运用了人工智能基础课程中讲授的多项 AIGC 技术：

| 课程技术 | 本项目应用 | 说明 |
|---|---|---|
| **MediaPipe** | 手部关键点检测 + 面部关键点检测 | 使用 Hand Landmarker（21 关键点/手）和 Face Landmarker（478 关键点）进行实时人体姿态提取，实现经典照片姿势复刻与骨骼线框叠加指导 |
| **LLM（大语言模型）** | AI 拍摄助手 + 朋友圈文案生成 + 智能路线规划 | 接入 OpenAI 兼容 API（支持 MiniMax 等国产模型），实现多轮对话推荐拍摄方案、自动生成朋友圈文案、智能规划校园拍摄路线 |
| **语音识别** | Web Speech API | 浏览器内置语音识别，支持中文语音输入，解放双手与 AI 助手对话 |

---

### 功能特色

#### 四大阶段
1. **封面迎宾页** - 青春洋溢的交大毕业季封面，一键开启拍摄企划
2. **逛街挑货页** - AI聊天推荐 + 地点/姿势推荐板块，像逛淘宝一样选拍摄方案
3. **购物车结算页** - 拖拽组合姿势和地点，AI自动匹配
4. **订单交付页** - AI朋友圈文案、智能路线图、拍摄说明书

#### AI 功能
- AI拍摄助手聊天（支持语音输入）
- AI智能路线规划
- AI朋友圈文案生成
- AI自动组合姿势与地点

#### MediaPipe 姿势比对
- 实时人体手部 + 面部关键点识别
- 经典照片姿势复刻
- 骨骼线框叠加指导
- 匹配度实时反馈

---

### 技术架构

#### 总体架构分层

| 架构分层 | 技术方案 | 职责说明 |
|---|---|---|
| **表现层** | HTML5 + CSS3 + ES6+ | 移动端优先的单页应用（SPA），四阶段页面流转 |
| **交互层** | Vanilla JS + SortableJS + Web Speech API | 拖拽购物车、语音识别输入、Canvas 骨骼绘制 |
| **AI 视觉层** | MediaPipe Tasks Vision (WASM) | 实时手部21关键点 + 面部478关键点检测与姿态比对 |
| **AI 认知层** | MiniMax LLM (via Cloudflare Worker) | 智能推荐、文案生成、路线规划、多轮对话 |
| **代理层** | Cloudflare Worker | API 安全代理，前端零密钥暴露 |
| **部署层** | GitHub Pages + Cloudflare | 静态资源托管 + 边缘计算服务 |

#### 前端技术栈

| 模块 | 技术/库 | 用途 |
|---|---|---|
| 页面框架 | 纯 HTML5 (单页应用) | `index.html` 为主入口，四阶段视图切换 |
| 样式方案 | CSS3 自定义属性 + Flex/Grid | 响应式布局，移动端优先设计 |
| 核心逻辑 | Vanilla JavaScript (ES6+) | `app.js` 统筹状态管理，模块化拆分 |
| 拖拽交互 | SortableJS | 购物车中地点/姿势卡片的拖拽排序与组合 |
| 语音输入 | Web Speech API | 中文语音识别，解放双手与 AI 对话 |
| 图形绘制 | HTML5 Canvas API | 实时骨骼线框叠加、匹配度可视化反馈 |
| 资源预加载 | `assets-config.js` | 图片/视频懒加载与缓存策略 |

#### AI 与计算机视觉技术栈

| 技术 | 模型/方案 | 功能描述 |
|---|---|---|
| **手部检测** | MediaPipe Hand Landmarker (`hand_landmarker.task`) | 21 关键点/手，最多同时检测 20 只手 |
| **面部检测** | MediaPipe Face Landmarker (`face_landmarker.task`) | 478 关键点/脸，提取轮廓、五官、眉眼鼻唇 |
| **运行时** | MediaPipe WASM (`vision_wasm_internal.wasm`) | 浏览器端本地推理，无需后端 GPU |
| **姿态比对** | 归一化欧氏距离 + 关键点配准 | 实时计算用户姿态与模板姿态的相似度 |
| **模板生成** | Python + OpenCV + MediaPipe | `train_skeleton.py` 从经典照片提取标准骨骼模板 |
| **模板存储** | `skeleton-templates.js` | 预计算模板直接嵌入前端，减少运行时开销 |

#### 后端与部署架构

| 组件 | 技术 | 架构设计要点 |
|---|---|---|
| **API 代理** | Cloudflare Worker (`worker.js`) | 转发 `/api/*` 请求，服务端注入 `Authorization` Bearer Token |
| **密钥管理** | Worker 环境变量 (`env.API_KEY`) | 前端不持有任何密钥，完全隔离敏感信息 |
| **CORS 处理** | Worker 响应头注入 | 支持跨域预检请求，适配 GitHub Pages 部署 |
| **前端托管** | GitHub Pages | 纯静态部署，借助 `.nojekyll` 绕过 Jekyll 构建 |
| **边缘部署** | Wrangler CLI (`wrangler.toml`) | 免费套餐每日 10 万次请求，全球边缘节点低延迟 |

#### 数据流转架构

| 数据类型 | 来源 | 处理流程 | 去向 |
|---|---|---|---|
| **姿势模板数据** | `assets/images/poses/classic_photos/` | Python 脚本提取 MediaPipe 关键点 → 归一化 → 结构化 | `js/skeleton-templates.js` |
| **实时视频流** | 用户摄像头 (`getUserMedia`) | MediaPipe WASM 本地推理 → 关键点坐标输出 | Canvas 叠加绘制 + 相似度计算 |
| **对话/文案请求** | 用户文本/语音输入 | 前端 → Cloudflare Worker → MiniMax API → 流式/一次性响应 | 前端渲染为卡片/文案 |
| **购物车状态** | 用户交互 (点击/拖拽) | 内存对象数组管理，无后端持久化 | 本地 session 级状态 |

---

### 项目结构

```
sjtu-pose-cart/
├── index.html               # 主页面（单页应用）
├── start.html               # 启动引导页
├── calibrate.html           # 摄像头校准页
├── mirror-photo.html        # 镜像自拍辅助页
├── train-skeleton.html      # 骨骼训练标注页
├── css/
│   └── style.css            # 样式（移动端优先）
├── js/
│   ├── app.js               # 主应用逻辑
│   ├── chat.js              # AI聊天功能
│   ├── cart.js              # 购物车管理
│   ├── data.js              # 地点与姿势数据
│   ├── config.js            # 应用配置（线上代理模式）
│   ├── config.local.example.js  # 本地开发配置示例
│   ├── assets-config.js     # 资源预加载配置
│   ├── mediapipe.js         # MediaPipe姿势比对与骨骼绘制
│   ├── skeleton-templates.js    # 训练生成的骨骼模板
│   ├── classic_1_touch_face.json    # 经典姿势骨架数据（示例）
│   └── mediapipe/
│       ├── vision_bundle.mjs        # MediaPipe Vision 任务包
│       └── wasm/
│           ├── vision_wasm_internal.js
│           ├── vision_wasm_internal.wasm
│           ├── vision_wasm_nosimd_internal.js
│           └── vision_wasm_nosimd_internal.wasm
├── models/
│   ├── face_landmarker.task     # 面部关键点模型（478点）
│   └── hand_landmarker.task     # 手部关键点模型（21点/手）
├── assets/
│   └── images/
│       ├── landmarks/        # 校园景点照片
│       ├── poses/            # 姿势参考照片
│       │   ├── classic_photos/  # 经典照片复刻
│       │   ├── solo_female/     # 单人女性姿势
│       │   └── group_mixed/     # 多人合影姿势
│       └── cover/            # 封面视频
├── worker/
│   ├── worker.js            # Cloudflare Worker API 代理
│   └── wrangler.toml        # Worker 部署配置
├── train_skeleton.py        # 骨架训练脚本（提取模板）
├── run_train.py             # 训练启动脚本
└── README.md
<<<<<<< HEAD
```
=======
```
>>>>>>> cccea5af51e38ba709ee097fc371770c3fd47140
