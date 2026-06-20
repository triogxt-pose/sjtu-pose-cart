# AI1202 人工智能基础 小组大作业

## 交大毕业照购物车——毕业季拍摄企划

一个专为上海交大毕业生设计的移动端Web应用，帮助规划毕业照拍摄路线和姿势。

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

---

### 部署到 GitHub Pages

1. 上传本项目到 GitHub 仓库
2. 进入 Settings → Pages
3. Source 选择 `main` 分支，目录选择 `/ (root)`
4. 保存后等待几分钟即可通过 `https://你的用户名.github.io/仓库名/` 访问