# 交大毕业照购物车 - 毕业季拍摄企划助手

一个专为上海交大毕业生设计的移动端Web应用，帮助规划毕业照拍摄路线和姿势。

## 功能特色

### 📸 四大阶段
1. **封面迎宾页** - 青春洋溢的交大毕业季封面，一键开启拍摄企划
2. **逛街挑货页** - AI聊天推荐 + 地点/姿势推荐板块，像逛淘宝一样选拍摄方案
3. **购物车结算页** - 拖拽组合姿势和地点，AI自动匹配
4. **订单交付页** - AI朋友圈文案、智能路线图、拍摄说明书

### 🤖 AI功能
- AI拍摄助手聊天（支持语音输入）
- AI智能路线规划
- AI朋友圈文案生成
- AI自动组合姿势与地点

### 📸 MediaPipe 姿势比对
- 实时人体姿态识别
- 老照片姿势复刻
- 骨骼线框叠加指导
- 匹配度实时反馈

## 技术栈

- 纯前端：HTML5 + CSS3 + JavaScript (ES6+)
- MediaPipe Tasks Vision（人体姿态识别）
- Web Speech API（语音输入）
- SortableJS（拖拽排序）
- 响应式设计（移动端优先）

## 项目结构

```
大作业/
├── index.html          # 主页面（单页应用）
├── css/
│   └── style.css       # 样式（移动端优先）
├── js/
│   ├── app.js          # 主应用逻辑
│   ├── chat.js         # AI聊天功能
│   ├── cart.js         # 购物车管理
│   ├── data.js         # 地点与姿势数据
│   └── mediapipe.js    # MediaPipe姿势比对
├── assets/
│   └── images/
│       ├── landmarks/  # 校园景点照片（待上传）
│       └── poses/      # 姿势参考照片（待上传）
└── README.md
```

## 部署到 GitHub Pages

1. Fork/上传本项目到你的 GitHub 仓库
2. 进入 Settings → Pages
3. Source 选择 `main` 分支，目录选择 `/ (root)`
4. 保存后等待几分钟即可通过 `https://你的用户名.github.io/仓库名/` 访问

## 参考代码

本项目核心技术：
- **MediaPipe Pose Landmarker** — 33 关键点人体姿态检测，实时骨架比对与匹配度评分
- **LLM API（OpenAI 兼容）** — AI 拍摄助手对话、智能路线规划、朋友圈文案生成
- **Web Speech API** — 浏览器内置语音识别，支持语音输入
- **SortableJS** — 拖拽排序，姿势与地点自由组合
- **Canvas API** — 骨骼线框叠加绘制、照片合成、实时镜像