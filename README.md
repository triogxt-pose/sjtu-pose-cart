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

### 技术栈

- 纯前端：HTML5 + CSS3 + JavaScript (ES6+)
- MediaPipe Tasks Vision（手部21关键点 + 面部478关键点）
- Web Speech API（语音输入）
- SortableJS（拖拽排序）
- Canvas API（骨骼线框叠加绘制）
- 响应式设计（移动端优先）

---

### 项目结构

```
sjtu-pose-cart/
├── index.html               # 主页面（单页应用）
├── css/
│   └── style.css            # 样式（移动端优先）
├── js/
│   ├── app.js               # 主应用逻辑
│   ├── chat.js              # AI聊天功能
│   ├── cart.js              # 购物车管理
│   ├── data.js              # 地点与姿势数据
│   ├── config.js            # 应用配置
│   ├── assets-config.js     # 资源预加载配置
│   ├── mediapipe.js         # MediaPipe姿势比对
│   └── skeleton-templates.js # 训练生成的骨骼模板
├── models/
│   ├── face_landmarker.task  # 面部关键点模型
│   └── hand_landmarker.task  # 手部关键点模型
├── assets/
│   └── images/
│       ├── landmarks/        # 校园景点照片
│       ├── poses/            # 姿势参考照片
│       │   ├── classic_photos/  # 经典照片复刻
│       │   ├── solo_female/     # 单人女性姿势
│       │   └── group_mixed/     # 多人合影姿势
│       └── cover/            # 封面视频
├── train_skeleton.py        # 骨架训练脚本
├── run_train.py             # 训练启动脚本
└── README.md
```
