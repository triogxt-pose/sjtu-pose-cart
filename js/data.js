// ===== 交大校园拍摄地点数据 =====
// 图片路径对应 assets/images/landmarks/ 目录中的实际文件

const LOCATIONS = [
    {
        id: 'loc1',
        name: '思源湖',
        emoji: '🏞️',
        desc: '湖光倒影，青春洋溢',
        tags: ['经典', '浪漫'],
        bestTime: '下午4-6点',
        img: 'assets/images/landmarks/siyuan_lake.png',
        coord: { lat: 31.0255, lng: 121.4368 },
        stayTime: 25
    },
    {
        id: 'loc2',
        name: '庙门',
        emoji: '⛩️',
        desc: '交大标志性校门，庄严大气',
        tags: ['经典', '正式'],
        bestTime: '上午8-10点',
        img: 'assets/images/landmarks/temple_gate.png',
        coord: { lat: 31.0240, lng: 121.4350 },
        stayTime: 15
    },
    {
        id: 'loc3',
        name: '凯旋门',
        emoji: '🏛️',
        desc: '标志建筑，毕业必拍',
        tags: ['经典', '庄重'],
        bestTime: '全天',
        img: 'assets/images/landmarks/triumphal_arch.png',
        coord: { lat: 31.0275, lng: 121.4390 },
        stayTime: 15
    },
    {
        id: 'loc4',
        name: '中院走廊',
        emoji: '🏫',
        desc: '百年底蕴，阳光走廊',
        tags: ['经典', '复古', '文艺'],
        bestTime: '下午2-5点',
        img: 'assets/images/landmarks/zhongyuan_corridor.png',
        coord: { lat: 31.0248, lng: 121.4360 },
        stayTime: 25
    },
    {
        id: 'loc5',
        name: '主图旋转楼梯',
        emoji: '📚',
        desc: '旋转楼梯，文艺感十足',
        tags: ['文艺', '经典'],
        bestTime: '上午9-12点',
        img: 'assets/images/landmarks/main_library_stairs.jpg',
        coord: { lat: 31.0265, lng: 121.4385 },
        stayTime: 20
    },
    {
        id: 'loc6',
        name: '植物园',
        emoji: '🌿',
        desc: '绿意盎然，自然清新',
        tags: ['浪漫', '文艺'],
        bestTime: '上午9-11点',
        img: 'assets/images/landmarks/botanical_garden.jpg',
        coord: { lat: 31.0260, lng: 121.4375 },
        stayTime: 20
    },
    {
        id: 'loc7',
        name: '电院大草坪',
        emoji: '🌳',
        desc: '开阔草坪，自由奔放',
        tags: ['活泼', '自由'],
        bestTime: '下午3-5点',
        img: 'assets/images/landmarks/dianyuan_lawn.jpg',
        coord: { lat: 31.0262, lng: 121.4365 },
        stayTime: 20
    },
    {
        id: 'loc8',
        name: '百岁雄鹰雕像',
        emoji: '🦅',
        desc: '雄鹰展翅，志存高远',
        tags: ['经典', '庄重'],
        bestTime: '上午9-11点',
        img: 'assets/images/landmarks/centennial_eagle.jpg',
        coord: { lat: 31.0258, lng: 121.4378 },
        stayTime: 15
    },
    {
        id: 'loc9',
        name: '蔷薇园',
        emoji: '🌹',
        desc: '花海烂漫，少女心爆棚',
        tags: ['浪漫', '文艺'],
        bestTime: '4-5月花期',
        img: 'assets/images/landmarks/rose_garden.jpg',
        coord: { lat: 31.0258, lng: 121.4378 },
        stayTime: 20
    },
    {
        id: 'loc10',
        name: '饮水思源碑',
        emoji: '💧',
        desc: '饮水思源，爱国荣校',
        tags: ['经典', '正式'],
        bestTime: '上午8-10点',
        img: 'assets/images/landmarks/yinshui_siyuan_stele.png',
        coord: { lat: 31.0250, lng: 121.4365 },
        stayTime: 15
    }
];

// ===== 拍摄姿势数据 =====
// 图片路径对应 assets/images/poses/ 目录中的实际文件

const POSES = [
    // ===== 单人女姿势 (solo_female/) =====
    { id: 'pose1',  name: '坐姿歪头',       emoji: '😊', people: '1',   style: '文艺',   desc: '侧坐歪头，甜美可爱',               img: 'assets/images/poses/solo_female/solo_female_sit_head_tilt.png' },
    { id: 'pose2',  name: '坐姿顶书',       emoji: '📖', people: '1',   style: '文艺',   desc: '头顶书本，俏皮有趣',               img: 'assets/images/poses/solo_female/solo_female_sit_book_head.png' },
    { id: 'pose3',  name: '站姿低头指天',   emoji: '☝️', people: '1',   style: '活泼',   desc: '低头指天，帅气十足',               img: 'assets/images/poses/solo_female/solo_female_stand_point_up.png' },
    { id: 'pose4',  name: '站姿抛学士帽',   emoji: '🎓', people: '1',   style: '经典',   desc: '经典毕业照必备姿势',               img: 'assets/images/poses/solo_female/solo_female_stand_throw_cap.png' },
    { id: 'pose5',  name: '站姿抱书',       emoji: '📚', people: '1',   style: '文艺',   desc: '怀抱书本，知性优雅',               img: 'assets/images/poses/solo_female/solo_female_stand_hold_book.png' },
    { id: 'pose6',  name: '站姿抱胸',       emoji: '🤷', people: '1',   style: '经典',   desc: '双手抱胸，自信从容',               img: 'assets/images/poses/solo_female/solo_female_stand_cross_arms.png' },
    { id: 'pose7',  name: '站姿指脑袋',     emoji: '🤔', people: '1',   style: '搞笑',   desc: '手指脑袋，俏皮可爱',               img: 'assets/images/poses/solo_female/solo_female_stand_point_head.png' },
    { id: 'pose8',  name: '站姿挥手',       emoji: '👋', people: '1',   style: '经典',   desc: '挥手致意，青春洋溢',               img: 'assets/images/poses/solo_female/solo_female_stand_wave.png' },
    { id: 'pose9',  name: '站姿晕倒',       emoji: '😵', people: '1',   style: '搞笑',   desc: '假装晕倒，搞怪有趣',               img: 'assets/images/poses/solo_female/solo_female_stand_faint.png' },
    { id: 'pose10', name: '站姿靠扶手',     emoji: '🚶', people: '1',   style: '文艺',   desc: '轻靠扶手，优雅自然',               img: 'assets/images/poses/solo_female/solo_female_stand_lean_rail.png' },
    { id: 'pose11', name: '蹲姿大拇指',     emoji: '👍', people: '1',   style: '活泼',   desc: '蹲姿比赞，活力满满',               img: 'assets/images/poses/solo_female/solo_female_squat_thumbs_up.png' },

    // ===== 多人男女姿势 (group_mixed/) =====
    { id: 'pose12', name: '四人坐姿合照',   emoji: '📸', people: '3-5', style: '经典',   desc: '四人并排坐姿合影',                 img: 'assets/images/poses/group_mixed/group_4_sit_photo.png' },
    { id: 'pose13', name: '四人坐姿比耶',   emoji: '✌️', people: '3-5', style: '活泼',   desc: '四人坐姿比耶',                     img: 'assets/images/poses/group_mixed/group_4_sit_peace.png' },
    { id: 'pose14', name: '四人低头比耶',   emoji: '✌️', people: '3-5', style: '活泼',   desc: '四人站立低头比耶',                 img: 'assets/images/poses/group_mixed/group_4_stand_look_down_peace.png' },
    { id: 'pose15', name: '四人抬头看天',   emoji: '🌤️', people: '3-5', style: '文艺',   desc: '四人抬头仰望天空',                 img: 'assets/images/poses/group_mixed/group_4_stand_look_up.png' },
    { id: 'pose16', name: '四人走廊奔跑',   emoji: '🏃', people: '3-5', style: '活泼',   desc: '四人在走廊奔跑',                   img: 'assets/images/poses/group_mixed/group_4_stand_corridor_run.png' },
    { id: 'pose17', name: '四人躺姿遮眼',   emoji: '😎', people: '3-5', style: '搞笑',   desc: '四人躺地遮眼看天',                 img: 'assets/images/poses/group_mixed/group_4_lie_cover_eyes.png' },
    { id: 'pose18', name: '六人叠罗汉',     emoji: '🧗', people: '6+',  style: '搞笑',   desc: '六人叠罗汉造型',                   img: 'assets/images/poses/group_mixed/group_6_stand_pyramid.png' },
    { id: 'pose19', name: '六人扳手腕',     emoji: '💪', people: '6+',  style: '搞笑',   desc: '六人围坐扳手腕',                   img: 'assets/images/poses/group_mixed/group_6_arm_wrestle.png' },
    { id: 'pose20', name: '六人操场奔跑',   emoji: '🏃', people: '6+',  style: '活泼',   desc: '六人在操场奔跑',                   img: 'assets/images/poses/group_mixed/group_6_run_field.png' },
    { id: 'pose21', name: '六人楼梯间',     emoji: '🪜', people: '6+',  style: '经典',   desc: '六人楼梯间错落合影',               img: 'assets/images/poses/group_mixed/group_6_staircase.png' },

    // ===== 经典照片复刻 (classic_photos/) - MediaPipe 可用 =====
    { id: 'pose22', name: '经典·甄嬛传(单人)',   emoji: '👑', people: '1',   style: '经典照片', desc: '复刻甄嬛传经典造型',         img: 'assets/images/poses/classic_photos/classic_1_empresses.png',      hasSkeleton: true, skeleton: 'classic_1_empresses' },
    { id: 'pose23', name: '经典·请坐(单人)',       emoji: '🪑', people: '1',   style: '经典照片', desc: '伸出右手，面带微笑',     img: 'assets/images/poses/classic_photos/classic_1_please_sit.jpg',      hasSkeleton: true, skeleton: 'classic_1_please_sit' },
    { id: 'pose24', name: '经典·向佐摸鼻梁(单人)', emoji: '🤏', people: '1',   style: '经典照片', desc: '手贴脸颊，近景特写',       img: 'assets/images/poses/classic_photos/classic_1_touch_face.jpg', hasSkeleton: true, skeleton: 'classic_1_touch_face' },
];

// ===== 校园最优游览顺序（用于智能路线规划） =====
const OPTIMAL_ROUTE_ORDER = [
    '庙门', '饮水思源碑', '凯旋门', '中院走廊', '主图旋转楼梯',
    '百岁雄鹰雕像', '植物园', '蔷薇园', '电院大草坪', '思源湖'
];

// ===== AI 对话关键词映射 =====
const AI_KEYWORDS = {
    people: {
        '1人':   ['一个人', '单人', '自己', '独照', '一个人拍', '1人'],
        '2人':   ['两个人', '双人', '情侣', '闺蜜', '基友', '二人', '两人', '2人'],
        '3-5人': ['三个人', '四个人', '五个人', '三五', '几个', '室友', '小组', '三四个', '小团队', '3人', '4人', '5人'],
        '6+':    ['六个', '七个', '八个', '全班', '大合照', '多人', '一群', '集体', '6人', '7人', '8人']
    },
    style: {
        '经典':    ['经典', '正式', '端庄', '传统', '常规', '爆款'],
        '搞笑':    ['搞笑', '欢乐', '逗比', '有趣', '沙雕', '开心', '搞怪'],
        '浪漫':    ['浪漫', '情绪风', '文艺', '唯美', '氛围感', '情感', '小清新'],
        '经典照片': ['经典照片', '复古', '怀旧', '老照片', '复刻', '历史', '甄嬛传', 'EXO', '特朗普', '专业团队', '吴京', '回头的诱惑'],
        '活泼':    ['活泼', '活力', '青春', '动感', '运动风']
    }
};

// ===== AI 文案模板库 =====
const COPY_TEMPLATES = {
    '深情': [
        {
            style: '💌 深情风',
            text: '在思源湖畔的晚风里\n在东川路的梧桐树下\n我们用四年的时光\n写下了最好的青春\n\n毕业快乐 | SJTU {year}'
        },
        {
            style: '💌 深情风',
            text: '还记得那年九月\n我们拖着行李箱走进校门\n如今六月\n我们把青春打包进行囊\n\n此去经年，愿我们\n永远是少年\n\nSJTU {year} 毕业季'
        },
        {
            style: '💌 深情风',
            text: '思源湖畔的倒影里\n我们笑成了当年模样\n四年的故事太长\n每一帧都想珍藏\n\n愿此去繁花似锦\n再相逢依旧如故\n\n上海交通大学 · {year}届'
        }
    ],
    '搞怪': [
        {
            style: '🎭 搞怪风',
            text: '🎓 顺利毕业！\n感谢室友不杀之恩\n感谢食堂阿姨的手抖\n感谢自己四年没秃\n\nSJTUers，江湖再见！👋'
        },
        {
            style: '🎭 搞怪风',
            text: '学士帽飞得比论文查重率还高！\n毕业照拍得比高数考试还认真！\n\n今天不写代码，只拍照 📸\n今天不赶ddl，只赶日落 🌅\n\n#交大毕业照购物车'
        },
        {
            style: '🎭 搞怪风',
            text: '四年青春一键打包\n知识？进脑子里了\n体重？留在食堂了\n回忆？全在照片里了\n\n毕业快乐！🎉\n#SJTU放羊大会'
        }
    ],
    '正经': [
        {
            style: '📋 正经风',
            text: '饮水思源，爱国荣校\n\n四载春秋，今朝毕业\n感谢母校的培养\n感谢师长的教诲\n感谢同窗的陪伴\n\n愿我们前程似锦，未来可期！\n\n{date} 摄于上海交通大学'
        },
        {
            style: '📋 正经风',
            text: '选择交大，就选择了责任\n\n毕业不是终点\n而是新征程的起点\n带着母校的期望\n奔赴山海，不负韶华\n\n上海交通大学 {year}届毕业生'
        },
        {
            style: '📋 正经风',
            text: '从交大出发，向世界启航\n\n感恩每一位老师的指引\n感谢每一位同学的陪伴\n愿我们各自努力\n顶峰相见\n\n{date}\n摄于上海交通大学 {locations}'
        }
    ]
};

// ===== 默认标语库 =====
const AI_GREETINGS = [
    '嗨！我是你的专属毕业照策划师 🎓\n请告诉我你们的人数、风格偏好，我来为你推荐最佳拍摄方案！',
    '欢迎来到毕业照选品大厅！🛒\n告诉我你们几个人、想要什么风格，我帮你搭配～',
    '毕业照怎么拍？交给我！📸\n先说说你们有几个人，喜欢什么风格？'
];

// ===== 资源路径后处理（支持 Cloudflare R2 CDN 切换） =====
(function resolveAssetPaths() {
    // 如果 AssetConfig 未加载，保持原路径
    if (typeof AssetConfig === 'undefined' || !AssetConfig.resolvePath) {
        return;
    }

    // 解析所有地标图片路径
    if (typeof LOCATIONS !== 'undefined' && Array.isArray(LOCATIONS)) {
        LOCATIONS.forEach((loc) => {
            if (loc.img) {
                loc.img = AssetConfig.resolvePath(loc.img);
            }
        });
    }

    // 解析所有姿势图片路径
    if (typeof POSES !== 'undefined' && Array.isArray(POSES)) {
        POSES.forEach((pose) => {
            if (pose.img) {
                pose.img = AssetConfig.resolvePath(pose.img);
            }
        });
    }
})();