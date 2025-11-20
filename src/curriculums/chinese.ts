// Структурированный учебный план для китайского языка (мандаринский) по уровням
export type Topic = { title: string; description?: string };
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CurriculumStage = {
  level: Level;
  grammar: Topic[];
  vocabulary: Topic[];
};

export const chineseCurriculum: CurriculumStage[] = [
  {
    level: 'A1',
    grammar: [
      { title: '人称代词和动词"是"', description: '我，你，他/她/它，我们，你们，他们/她们/它们；是。' },
      { title: '动词的一般现在时', description: '动词基本形式和常用动词。' },
      { title: '名词的单复数', description: '个，些，复数表达。' },
      { title: '否定句', description: '不，没。' },
      { title: '疑问句', description: '吗，什么，谁，哪里。' },
      { title: '基本介词', description: '在，上，下，前，后。' },
      { title: '时间表达', description: '今天，明天，昨天。' },
      { title: '量词', description: '个，本，张。' },
      { title: '形容词的基本用法', description: '大，小，好，坏。' },
      { title: '常用表达', description: '有，没有，可以。' },
    ],
    vocabulary: [
      { title: '问候与自我介绍', description: '你好，再见，我叫...' },
      { title: '家庭成员', description: '妈妈，爸爸，哥哥，姐姐...' },
      { title: '数字', description: '一，二，三...' },
      { title: '职业', description: '老师，医生，学生...' },
      { title: '食物和饮料', description: '米饭，水，苹果...' },
      { title: '天气', description: '晴，雨，雪...' },
      { title: '日期和时间', description: '星期一，月，年...' },
      { title: '城市与交通', description: '公交，车站，路...' },
      { title: '家和家具', description: '桌子，椅子，房间...' },
      { title: '购物', description: '买，价格，超市...' },
    ],
  },
  {
    level: 'A2',
    grammar: [
      { title: '比较级和最高级', description: '更，最。' },
      { title: '过去时', description: '了，用于表示完成。' },
      { title: '将来时', description: '会，将要。' },
      { title: '可数与不可数名词', description: '一些，很多。' },
      { title: '情态动词：要，能', description: '表示需要和可能性。' },
      { title: '进行时', description: '正在。' },
      { title: '频率副词', description: '总是，经常，有时，从不。' },
      { title: '宾语代词', description: '我，你，他/她/它等作宾语。' },
      { title: '时间介词', description: '在...时，...以后。' },
      { title: '反问句', description: '不是吗？' },
    ],
    vocabulary: [
      { title: '旅行', description: '火车，票，出发...' },
      { title: '节日', description: '生日，春节...' },
      { title: '健康', description: '医生，生病，药...' },
      { title: '衣服和颜色', description: '裤子，衬衫，蓝色，红色...' },
      { title: '工作与职业', description: '办公室，同事，老板...' },
      { title: '信件与电子邮件', description: '信，电子邮件...' },
      { title: '时间与约会', description: '约会，时间...' },
    ],
  },
  {
    level: 'B1',
    grammar: [
      { title: '过去进行时', description: '正在...的时候。' },
      { title: '条件句', description: '如果...就...' },
      { title: '定语从句', description: '的，谁，什么，哪里。' },
      { title: '间接引语', description: '他说...' },
      { title: '动词重叠', description: '看看，说说。' },
      { title: '最近完成时', description: '刚刚...' },
      { title: '反身动词', description: '自己...' },
      { title: '被动语态', description: '被...' },
      { title: '疑问结构', description: '怎么，多少，为什么...' },
      { title: '形容词顺序', description: '漂亮的大房子。' },
    ],
    vocabulary: [
      { title: '工作与职业发展', description: '工作，申请，老板...' },
      { title: '教育', description: '学校，大学...' },
      { title: '社会与文化', description: '文化，媒体...' },
      { title: '自然与环境', description: '自然，环境...' },
      { title: '故事与事件', description: '故事，事件...' },
      { title: '情感与观点', description: '情感，观点...' },
    ],
  },
  {
    level: 'B2',
    grammar: [
      { title: '过去完成时', description: '...过了。' },
      { title: '虚拟语气', description: '要是...就好了。' },
      { title: '推测与假设', description: '可能，也许。' },
      { title: '使役结构', description: '让...做...' },
      { title: '愿望表达', description: '希望...' },
      { title: '倒装句', description: '从不见过...' },
      { title: '连接词', description: '但是，虽然，尽管。' },
      { title: '强调结构', description: '就是...的。' },
      { title: '搭配', description: '做决定，写作业。' },
      { title: '动词与介词搭配', description: '走到，来到...' },
    ],
    vocabulary: [
      { title: '商务与金融', description: '商务，钱，银行...' },
      { title: '科学与技术', description: '技术，研究...' },
      { title: '旅行与文化', description: '旅行，旅游...' },
      { title: '经济', description: '经济，金融...' },
      { title: '健康与运动', description: '健康，营养，锻炼...' },
      { title: '人际关系', description: '友谊，关系...' },
    ],
  },
  {
    level: 'C1',
    grammar: [
      { title: '高级被动语态', description: '据说..., 认为...' },
      { title: '复杂句型', description: '多重从句。' },
      { title: '正式与非正式语体', description: '根据场合选择风格。' },
      { title: '成语与固定表达', description: '画蛇添足，半途而废。' },
      { title: '论证与观点表达', description: '不同方式表达同意/不同意。' },
      { title: '名词化', description: '动词/形容词转为名词。' },
    ],
    vocabulary: [
      { title: '学术词汇', description: '研究，分析，论文...' },
      { title: '职业交流', description: '谈判，演讲...' },
      { title: '媒体', description: '报纸，广播，媒体...' },
      { title: '政治与社会', description: '政府，社会，选举...' },
      { title: '生态与环境', description: '气候变化，环境保护...' },
      { title: '文化与艺术', description: '文学，戏剧，艺术...' },
    ],
  },
  {
    level: 'C2',
    grammar: [
      { title: '复杂结构的掌握', description: '多层次句子，高级结构。' },
      { title: '风格与语体的细微差别', description: '正式，非正式，学术风格。' },
      { title: '各种时态和语态的灵活运用', description: '现在，过去，将来，被动等。' },
      { title: '高级成语与俗语', description: '谚语，成语。' },
      { title: '抽象论证', description: '哲学，艺术，政治。' },
      { title: '文本分析与解读', description: '文学评论，论文。' },
    ],
    vocabulary: [
      { title: '抽象与哲学概念', description: '伦理，美学，正义...' },
      { title: '高级职业词汇', description: '法律，医学，技术...' },
      { title: '文学与艺术术语', description: '隐喻，象征...' },
      { title: '跨文化交流', description: '跨文化，全球化...' },
      { title: '现代趋势', description: '数字化，创新...' },
      { title: '辩论与讨论表达', description: '表达观点，反对...' },
    ],
  },
]; 
