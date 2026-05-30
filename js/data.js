// ===== 交大校园拍摄地点数据 =====
// TODO: 上传实际校园景点照片到 assets/images/landmarks/ 目录
const LOCATIONS = [
    {
        id: 'loc1',
        name: '思源湖',
        emoji: '🏞️',
        desc: '湖光倒影，青春洋溢',
        tags: ['经典', '浪漫'],
        bestTime: '下午4-6点',
        img: 'assets/images/landmarks/siyuan_lake.jpg'
    },
    {
        id: 'loc2',
        name: '仰思坪',
        emoji: '🌿',
        desc: '绿草如茵，仰思致远',
        tags: ['经典', '庄重'],
        bestTime: '上午9-11点',
        img: 'assets/images/landmarks/yangsi_ping.jpg'
    },
    {
        id: 'loc3',
        name: '新行政楼',
        emoji: '🏛️',
        desc: '现代建筑，大气磅礴',
        tags: ['正式', '现代'],
        bestTime: '全天',
        img: 'assets/images/landmarks/admin_building.jpg'
    },
    {
        id: 'loc4',
        name: '中院',
        emoji: '🏫',
        desc: '百年底蕴，阳光庭院',
        tags: ['经典', '复古'],
        bestTime: '下午2-5点',
        img: 'assets/images/landmarks/zhongyuan.jpg'
    },
    {
        id: 'loc5',
        name: '宣怀大道',
        emoji: '🛤️',
        desc: '林荫大道，浪漫至极',
        tags: ['浪漫', '经典'],
        bestTime: '下午4-6点',
        img: 'assets/images/landmarks/xuanhuai_road.jpg'
    },
    {
        id: 'loc6',
        name: '包玉刚图书馆',
        emoji: '📚',
        desc: '学府气息，书香满溢',
        tags: ['经典', '文艺'],
        bestTime: '上午9-12点',
        img: 'assets/images/landmarks/baoyugang_library.jpg'
    },
    {
        id: 'loc7',
        name: '东大门',
        emoji: '🚪',
        desc: '交大正门，必打卡地',
        tags: ['经典', '正式'],
        bestTime: '上午8-10点',
        img: 'assets/images/landmarks/east_gate.jpg'
    },
    {
        id: 'loc8',
        name: '凯旋门',
        emoji: '🏛️',
        desc: '标志建筑，毕业必拍',
        tags: ['经典', '庄重'],
        bestTime: '全天',
        img: 'assets/images/landmarks/kaixuan_gate.jpg'
    },
    {
        id: 'loc9',
        name: '蔷薇园',
        emoji: '🌹',
        desc: '花海烂漫，少女心爆棚',
        tags: ['浪漫', '文艺'],
        bestTime: '4-5月花期',
        img: 'assets/images/landmarks/qiangwei_garden.jpg'
    },
    {
        id: 'loc10',
        name: '电院大草坪',
        emoji: '🌳',
        desc: '开阔草坪，自由奔放',
        tags: ['活泼', '自由'],
        bestTime: '下午3-5点',
        img: 'assets/images/landmarks/dianyuan_lawn.jpg'
    }
];

// ===== 拍摄姿势数据 =====
// TODO: 上传姿势训练照片到 assets/images/poses/ 目录
const POSES = [
    // 1人姿势
    { id: 'pose1', name: '抛学士帽', emoji: '🎓', people: '1', style: '经典', desc: '经典毕业照必备姿势', img: 'assets/images/poses/throw_cap.jpg' },
    { id: 'pose2', name: '回眸一笑', emoji: '😊', people: '1', style: '经典', desc: '自然回头，抓拍最美瞬间', img: 'assets/images/poses/look_back.jpg' },
    { id: 'pose3', name: '捧书阅读', emoji: '📖', people: '1', style: '文艺', desc: '假装在看书，文艺范十足', img: 'assets/images/poses/reading.jpg' },
    { id: 'pose4', name: '比心手势', emoji: '💕', people: '1', style: '经典', desc: '单手或双手比心', img: 'assets/images/poses/heart.jpg' },
    
    // 2人姿势
    { id: 'pose5', name: '双人比心', emoji: '💑', people: '2', style: '经典', desc: '两人合体比大爱心', img: 'assets/images/poses/double_heart.jpg' },
    { id: 'pose6', name: '背靠背', emoji: '👫', people: '2', style: '浪漫', desc: '背靠背而坐，岁月静好', img: 'assets/images/poses/back_to_back.jpg' },
    { id: 'pose7', name: '牵手前行', emoji: '🤝', people: '2', style: '浪漫', desc: '手牵手走向镜头', img: 'assets/images/poses/hand_in_hand.jpg' },
    { id: 'pose8', name: '搞笑鬼脸', emoji: '😜', people: '2', style: '搞笑', desc: '一起做鬼脸，欢乐无限', img: 'assets/images/poses/funny_face.jpg' },
    
    // 3-5人姿势
    { id: 'pose9', name: '阶梯合影', emoji: '📸', people: '3-5', style: '经典', desc: '阶梯上错落站开', img: 'assets/images/poses/stairs_group.jpg' },
    { id: 'pose10', name: '跳跃抓拍', emoji: '🤸', people: '3-5', style: '活泼', desc: '一起跳起来', img: 'assets/images/poses/jump.jpg' },
    { id: 'pose11', name: '围圈躺拍', emoji: '🌟', people: '3-5', style: '创意', desc: '头靠头围成圈俯拍', img: 'assets/images/poses/circle_lie.jpg' },
    { id: 'pose12', name: '千手观音', emoji: '🧘', people: '3-5', style: '搞笑', desc: '排成一列做出千手观音', img: 'assets/images/poses/thousand_hands.jpg' },
    
    // 6人以上
    { id: 'pose13', name: '大合影', emoji: '👨‍👩‍👧‍👦', people: '6+', style: '经典', desc: '多排站立的经典合影', img: 'assets/images/poses/big_group.jpg' },
    { id: 'pose14', name: 'V字队形', emoji: '✈️', people: '6+', style: '创意', desc: '排成V字队形', img: 'assets/images/poses/v_shape.jpg' },
    { id: 'pose15', name: '人形拼字', emoji: '🔤', people: '6+', style: '创意', desc: '用身体拼出 SJTU', img: 'assets/images/poses/spell_sjtu.jpg' },
    { id: 'pose16', name: '全员躺平', emoji: '😴', people: '6+', style: '搞笑', desc: '所有人躺成一行', img: 'assets/images/poses/all_lie_down.jpg' },
    
    // 老照片复刻 (MediaPipe可用)
    { id: 'pose17', name: '复刻1920老照片', emoji: '🕰️', people: '2', style: '老照片', desc: '复刻交大历史老照片姿势', img: 'assets/images/poses/old_photo_1920.jpg', hasSkeleton: true },
    { id: 'pose18', name: '复刻1950毕业照', emoji: '📷', people: '3-5', style: '老照片', desc: '复刻五十年代毕业合影', img: 'assets/images/poses/old_photo_1950.jpg', hasSkeleton: true },
    { id: 'pose19', name: '复刻1980学士照', emoji: '🎞️', people: '1', style: '老照片', desc: '复刻八十年代单人学士照', img: 'assets/images/poses/old_photo_1980.jpg', hasSkeleton: true },
];

// ===== AI对话关键词映射 =====
const AI_KEYWORDS = {
    people: {
        '1人': ['一个人', '单人', '自己', '独照', '一个人拍'],
        '2人': ['两个人', '双人', '情侣', '闺蜜', '基友', '二人', '两人'],
        '3-5人': ['三个人', '四个人', '五个人', '三五', '几个', '室友', '小组', '三四个', '小团队'],
        '6+': ['六个', '七个', '八个', '全班', '大合照', '多人', '一群', '集体']
    },
    style: {
        '经典': ['经典', '正式', '端庄', '传统'],
        '搞笑': ['搞笑', '欢乐', '逗比', '有趣', '沙雕', '开心'],
        '浪漫': ['浪漫', '情绪风', '文艺', '唯美', '氛围感', '情感'],
        '老照片': ['老照片', '复刻', '复古', '怀旧', '历史'],
        '活泼': ['活泼', '活力', '青春', '动感']
    }
};

// ===== AI文案模板 =====
const COPY_TEMPLATES = [
    {
        style: '深情',
        template: '在思源湖畔的晚风里\n在东川路的梧桐树下\n我们用四年的时光\n写下了最好的青春\n\n毕业快乐 | SJTU {year}'
    },
    {
        style: '搞怪',
        template: '🎓 顺利毕业！\n感谢室友不杀之恩\n感谢食堂阿姨的手抖\n感谢自己还没秃\n\nSJTUers，江湖再见！👋'
    },
    {
        style: '复古',
        template: '从南洋公学到上海交大\n百廿余年，弦歌不辍\n今日我们在此定格\n续写属于这个时代的篇章\n\n{date} 摄于交大校园'
    }
];