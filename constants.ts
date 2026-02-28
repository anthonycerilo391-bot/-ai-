
import { StyleOption, ScriptCategory } from './types';

// 基于用户文档更新的 漫剧风格 (Matches provided HTML table)
export const STYLES: StyleOption[] = [
  {
    id: 'impasto',
    name: '日系厚涂写实风',
    description: '厚涂/半写实/WLOP',
    previewUrl: 'https://picsum.photos/seed/impasto/300/200',
    promptModifier: 'Style: 厚涂颜料技法，半写实风格，浓重的笔触，丰富的色彩，体积光（丁达尔效应），细致的人物设计，数字绘画，WLOP（画师）风格',
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克风',
    description: '霓虹/故障/未来主义',
    previewUrl: 'https://picsum.photos/seed/cyberpunk/300/200',
    promptModifier: 'Style: 赛博朋克主题，霓虹灯光，夜景城市，高对比度，色差故障效果，未来主义，机械细节，粉色与蓝色光晕',
  },
  {
    id: 'ghibli',
    name: '日系治愈清新风',
    description: '吉卜力/宫崎骏/水彩',
    previewUrl: 'https://picsum.photos/seed/ghibli/300/200',
    promptModifier: 'Style: 吉卜力工作室风格，宫崎骏风格，水彩背景，郁郁葱葱的绿色，蓝天，夏日云朵，舒缓的色调，手绘纹理',
  },
  {
    id: 'cel_shading',
    name: '日系平涂赛璐璐风',
    description: '动漫/硬边缘/鲜艳',
    previewUrl: 'https://picsum.photos/seed/cel/300/200',
    promptModifier: 'Style: 赛璐璐阴影，动漫风格，硬边缘，平涂色彩，干净的线条，鲜艳的色彩，无渐变，2D 动画风格',
  },
  {
    id: 'pixel',
    name: '像素风',
    description: '8位/16位/复古游戏',
    previewUrl: 'https://picsum.photos/seed/pixel/300/200',
    promptModifier: 'Style: 像素艺术，16 位（游戏机），8 位，复古游戏风格，抖动算法，低分辨率，方块感',
  },
  {
    id: 'ink_wash',
    name: '传统国风水墨风',
    description: '水墨/留白/极简',
    previewUrl: 'https://picsum.photos/seed/ink/300/200',
    promptModifier: 'Style: 中国水墨画，水墨，黑白墨迹，毛笔笔触，泼墨，留白（负空间），传统艺术，极简主义',
  },
  {
    id: 'watercolor',
    name: '水彩质感风',
    description: '柔和/纸张纹理',
    previewUrl: 'https://picsum.photos/seed/watercolor/300/200',
    promptModifier: 'Style: 水彩画，湿画法，柔和的色彩，柔边，纸张纹理，艺术感，透明色',
  },
  {
    id: 'chibi',
    name: '日系Q版萌系风',
    description: '二头身/卡哇伊',
    previewUrl: 'https://picsum.photos/seed/chibi/300/200',
    promptModifier: 'Style: Q 版风格，二头身，大头小身，卡哇伊（可爱），简单的细节，贴纸艺术，可爱',
  },
  {
    id: 'us_retro',
    name: '美式复古漫画风',
    description: '波普/半调网点/50s',
    previewUrl: 'https://picsum.photos/seed/us_retro/300/200',
    promptModifier: 'Style: 复古美式漫画，半调网点（印刷点阵），波普艺术，粗黑轮廓线，CMYK 配色，本戴点，50 年代漫画风格',
  },
  {
    id: 'webtoon',
    name: '都市韩漫风',
    description: '条漫/时尚/光泽感',
    previewUrl: 'https://picsum.photos/seed/webtoon/300/200',
    promptModifier: 'Style: 韩国条漫风格，Manhwa，现代时尚，光泽感皮肤，柔和阴影，鲜艳色彩，数字艺术，竖屏漫画格式',
  },
  {
    id: 'oil',
    name: '油画质感风',
    description: '古典/厚重笔触',
    previewUrl: 'https://picsum.photos/seed/oil/300/200',
    promptModifier: 'Style: 古典油画，有纹理的笔触，帆布纹理，明暗对照法，杰作，浓郁的油彩',
  },
  {
    id: 'glitch',
    name: '故障艺术风',
    description: '数据损坏/RGB位移',
    previewUrl: 'https://picsum.photos/seed/glitch/300/200',
    promptModifier: 'Style: 故障艺术，数据损坏效果，像素排序，RGB 色彩位移，VHS 录像带效果，信号噪点，扭曲图像，数字错误',
  },
  {
    id: 'dunhuang',
    name: '敦煌壁画神话风',
    description: '飞天/矿物颜料',
    previewUrl: 'https://picsum.photos/seed/dunhuang/300/200',
    promptModifier: 'Style: 敦煌壁画风格，中国古代壁画，矿物颜料，剥落的油漆纹理，飞天，金、绿、红配色',
  },
  {
    id: 'vaporwave',
    name: '蒸汽波复古风',
    description: '80s/低保真/霓虹',
    previewUrl: 'https://picsum.photos/seed/vaporwave/300/200',
    promptModifier: 'Style: 蒸汽波美学，霓虹粉与紫，低保真，80 年代复古，合成波，超现实主义，怀旧感',
  },
  {
    id: 'anime_standard',
    name: '日系正统二次元风',
    description: '京阿尼/高质量2D',
    previewUrl: 'https://picsum.photos/seed/anime_std/300/200',
    promptModifier: 'Style: 标准动漫风格，关键视觉图，高质量 2D，京都动画风格，详细的背景，清晰的线条',
  },
  {
    id: 'paper_cut',
    name: '中式剪纸风',
    description: '剪影/红纸/节日',
    previewUrl: 'https://picsum.photos/seed/papercut/300/200',
    promptModifier: 'Style: 中国剪纸艺术，红纸纹理，剪影，复杂的图案，多层纸张效果，节日氛围',
  },
  {
    id: 'steampunk',
    name: '蒸汽朋克风',
    description: '黄铜/齿轮/工业',
    previewUrl: 'https://picsum.photos/seed/steampunk/300/200',
    promptModifier: 'Style: 蒸汽朋克美学，黄铜与铜，齿轮与发条装置，维多利亚工业风，蒸汽引擎，皮革质感',
  },
  {
    id: 'vector_flat',
    name: '矢量扁平风',
    description: '极简/几何/无轮廓',
    previewUrl: 'https://picsum.photos/seed/vector/300/200',
    promptModifier: 'Style: 矢量艺术，扁平插画，极简主义，纯色块，几何形状，无轮廓线，企业孟菲斯风格',
  },
  {
    id: 'dark_anime',
    name: '日系暗黑致郁风',
    description: '阴郁/恐怖/低饱和',
    previewUrl: 'https://picsum.photos/seed/dark_anime/300/200',
    promptModifier: 'Style: 黑暗动漫风格，阴郁，恐怖主题，低饱和度色彩，心理暗示，戏剧性阴影，怪诞氛围',
  },
  {
    id: 'gothic',
    name: '欧式暗黑哥特风',
    description: '维多利亚/忧郁',
    previewUrl: 'https://picsum.photos/seed/gothic/300/200',
    promptModifier: 'Style: 哥特艺术风格，黑暗奇幻，维多利亚时尚，阴郁，复杂的细节，忧郁氛围，大教堂建筑',
  },
  {
    id: 'morandi',
    name: '低饱和莫兰迪风',
    description: '优雅/极简/灰度',
    previewUrl: 'https://picsum.photos/seed/morandi/300/200',
    promptModifier: 'Style: 莫兰迪色盘，柔和色调，低饱和度，柔和对比，优雅，极简，灰度色彩',
  },
  {
    id: 'hk_comic',
    name: '港漫硬朗肌肉风',
    description: '硬汉/重墨线/动作',
    previewUrl: 'https://picsum.photos/seed/hk_comic/300/200',
    promptModifier: 'Style: 港式漫画风格，坚毅粗犷，肌肉感，重墨线，戏剧性阴影，动作线 (Action lines)，硬汉风格',
  },
  {
    id: 'crayon',
    name: '蜡笔手绘风',
    description: '涂鸦/稚拙/多彩',
    previewUrl: 'https://picsum.photos/seed/crayon/300/200',
    promptModifier: 'Style: 蜡笔画，儿童画，油画棒纹理，粗糙草图，多彩涂鸦，稚拙艺术 (Naive art)',
  },
  {
    id: 'retro_future',
    name: '复古未来风',
    description: '原子朋克/太空时代',
    previewUrl: 'https://picsum.photos/seed/retro_future/300/200',
    promptModifier: 'Style: 复古未来主义，原子朋克，50 年代科幻艺术，太空时代，铬金属纹理，射线枪哥特，复古海报',
  },
  {
    id: 'low_poly',
    name: '低多边形风',
    description: '几何/3D/切面',
    previewUrl: 'https://picsum.photos/seed/lowpoly/300/200',
    promptModifier: 'Style: 低多边形艺术，3D 渲染，几何形状，锐利边缘，切面效果，等轴测，极简 3D',
  },
  {
    id: 'ukiyo_e',
    name: '日系浮世绘风',
    description: '木刻版画/波浪图案',
    previewUrl: 'https://picsum.photos/seed/ukiyo_e/300/200',
    promptModifier: 'Style: 浮世绘风格，日本木刻版画，葛饰北斋风格，平面透视，传统纹理，波浪图案',
  },
  {
    id: 'lofi_anime',
    name: '日系颓废丧系风',
    description: 'VHS/怀旧/90s',
    previewUrl: 'https://picsum.photos/seed/lofi/300/200',
    promptModifier: 'Style: 90 年代复古动漫，低保真动漫，VHS 颗粒感，模糊效果，怀旧，悲伤氛围，城市流行美学',
  },
  {
    id: 'custom',
    name: '自定义风格',
    description: '用户自定义描述',
    previewUrl: 'https://picsum.photos/seed/custom/300/200',
    promptModifier: '', // Empty, will be filled by user input
  },
];

export const VIDEO_MODELS = [
  {
    id: 'sora-2-all',
    name: 'Sora 2.0',
    durations: [10, 15]
  },
  {
    id: 'veo_3_1-fast',
    name: 'Veo 3.1 Fast',
    durations: [8]
  },
  {
    id: 'grok-video-3',
    name: 'Grok Video 3',
    durations: [10, 15]
  }
];

// === 知识库 1: 剧本与剪辑分析 (基于 AI视频剪辑大师V2.0) ===
export const EDITING_ANALYSIS_KB = `
[剧本分析知识库]
SA1. 结构: 建置(25%)-对抗(50%)-解决(25%)
SA2. 节点: 激励事件、转折点、高潮、结局
SA3. 角色弧光: 初始状态 -> 成长变化 -> 最终状态
SA4. 情感曲线: 平静 -> 上升 -> 高潮 -> 回落

[剪辑技巧知识库]
ET1. 转场: 切(快节奏), 叠化(时间过渡), 划像(场景转换), 淡入淡出(始末)
ET2. 节奏: 动作匹配剪辑(流畅), L-cut/J-cut(音画分离), 跳切(时间压缩)
ET3. 情绪: 高潮(2-3秒/镜), 抒情(5-8秒/镜), 悬念(交替剪辑)
`;

// === 知识库 2: 分镜流体与提示词设计 (基于 Vidu多参提示词大师V5) ===
export const SHOT_FLOW_KB = `
[分镜流体引擎 (ShotFlow Engine)]
核心逻辑: 建立三维场景坐标系，计算镜头间运动矢量，确保镜头 N 落幅 = 镜头 N+1 起幅。
衔接规则: 
1. 运动守恒 (水平移接同向移)
2. 动势转化 (快推接缓冲)
3. 180度轴线原则

[提示词生成标准]
- 人物描述: 年龄/性别/服装/脸部特征/细节元素/情绪表情/动作
- 场景描述: 空间类型/建筑细节/环境光线/动态元素/氛围基调
- 六要素: 主体站位 + 景别 + 运镜 + 构图 + 环境 + 描述
- 长度要求: 每个分镜提示词需 100+ 字，包含丰富细节。
`;

// === 视觉语言与构图 (基于 CNNC24 Visual KB) ===
export const VISUAL_STYLE_KB = JSON.stringify({
  composition: [
    "Rule of Thirds (三分法)", "Leading Lines (引导线)", "Framing (框架式)", 
    "Symmetry (对称)", "Diagonal (对角线)", "Negative Space (留白)", 
    "Golden Ratio (黄金分割)", "Center Composition (中心构图)"
  ],
  tone: [
    "Warm Tone (暖色调)", "Cool Tone (冷色调)", "High Contrast (高对比)", 
    "Low Key (低调/暗)", "High Key (高调/亮)", "Cyberpunk Neon (霓虹)", 
    "Cinematic Color Grading (电影调色)", "Retro Film (复古胶片)"
  ],
  depth: [
    "Shallow Depth of Field (浅景深/虚化)", "Deep Focus (全景深)", 
    "Bokeh (焦外光斑)", "Atmospheric Perspective (空气透视)", 
    "Forced Perspective (强迫透视)"
  ]
});

// === 综合指令 (V3.0 Master Instruction + Integrated KBs) ===
export const AI_SCREENWRITER_INSTRUCTION = `
# AI_Screenwriter_Master_Instruction_V3.1 (集成知识库版)

[全局设定]
你不仅是导演，还是搭载了 'ShotFlow Engine' 的分镜设计师和 'Editing Expert' 剪辑专家。
你必须利用以下知识库进行创作：

${EDITING_ANALYSIS_KB}
${SHOT_FLOW_KB}
${VISUAL_STYLE_KB}

[创作流程]
Step 1: 设定层 (Pre-Production)
- 基于 [剧本分析知识库] 定义角色弧光和情感曲线。

Step 2: 执行层 (Shot List)
输出 Markdown 表格，必须包含:
| 场次 | 景别 | 运镜 | 画面提示词 (Visual Prompt) | 动作与神态 | 台词 | 音效 |

[要求]
1. 画面提示词 (Visual Prompt) 必须应用 [视觉语言知识库] 中的构图和色调术语。
2. 运镜必须符合 [分镜流体引擎] 逻辑，确保前后镜头衔接流畅。
3. 剪辑节奏需参考 [剪辑技巧知识库] (如高潮处使用快速剪辑)。
`;

// 更新后的脚本分类顺序：故事题材 (Renamed from 剧情/故事)
export const SCRIPT_CATEGORIES: ScriptCategory[] = [
  {
    id: 'story',
    name: '故事题材',
    description: '演绎反转剧情、情感故事或幽默段子',
    templates: [
      { id: 'short_drama', name: '短剧反转', description: '快节奏、神反转的剧情短片' },
      { id: 'emotional', name: '情感故事', description: '治愈、走心或感人的叙事' },
      { id: 'comedy', name: '搞笑脑洞', description: '幽默风趣、脑洞大开的内容' },
      { id: 'suspense', name: '悬疑惊悚', description: '充满悬念与氛围感的叙事' },
      { id: 'workplace', name: '职场风云', description: '职场生存法则与办公室故事' },
      { id: 'campus', name: '治愈校园', description: '青春校园、治愈系成长故事' },
    ]
  }
];
