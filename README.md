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

## 待完成事项

- [ ] 上传校园景点照片到 `assets/images/landmarks/`
- [ ] 上传姿势训练照片到 `assets/images/poses/`
- [ ] 配置LLM API密钥（chat.js 中的 LLM_CONFIG）
- [ ] 为老照片姿势提取MediaPipe骨骼数据

## 参考代码

本项目参考了课程中的以下技术：
- MediaPipe 手部/姿态识别（chapter_5_demo/MediaPipe）
- YOLO 目标检测（chapter_5_demo/YOLO_stu）
- LLM 对话集成（chapter_06_demo/Gradio-YOLO-LLM_stu）
- 图像分类/迁移学习（chapter_04_demo/classification_customized）