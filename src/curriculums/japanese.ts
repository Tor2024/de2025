// Структурированный учебный план для японского языка по уровням
export type Topic = { title: string; description?: string };
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CurriculumStage = {
  level: Level;
  grammar: Topic[];
  vocabulary: Topic[];
};

export const japaneseCurriculum: CurriculumStage[] = [
  {
    level: 'A1',
    grammar: [
      { title: '人称代名詞と動詞「です」', description: 'わたし、あなた、かれ、かのじょ、わたしたち等; です。' },
      { title: '動詞の現在形', description: '基本的な動詞の活用。' },
      { title: '名詞の単数・複数', description: '～たち、～ら。' },
      { title: '否定文', description: '～ではありません、～じゃない。' },
      { title: '疑問文', description: 'か、なに、だれ、どこ。' },
      { title: '基本的な助詞', description: 'は、が、を、に、で。' },
      { title: '時間の表現', description: 'きょう、あした、きのう。' },
      { title: '数詞', description: '一、二、三...' },
      { title: '形容詞の基本', description: '大きい、小さい、いい、わるい。' },
      { title: '基本表現', description: 'あります、います、できます。' },
    ],
    vocabulary: [
      { title: 'あいさつと自己紹介', description: 'こんにちは、さようなら、わたしの名前は...' },
      { title: '家族', description: '母、父、兄、姉...' },
      { title: '数字', description: '一、二、三...' },
      { title: '職業', description: '先生、医者、学生...' },
      { title: '食べ物と飲み物', description: 'ごはん、水、りんご...' },
      { title: '天気', description: '晴れ、雨、雪...' },
      { title: '日付と時間', description: '月曜日、月、年...' },
      { title: '町と交通', description: 'バス、駅、道...' },
      { title: '家と家具', description: 'テーブル、いす、部屋...' },
      { title: '買い物', description: '買う、値段、スーパー...' },
    ],
  },
  {
    level: 'A2',
    grammar: [
      { title: '比較と最上級', description: 'もっと、いちばん。' },
      { title: '過去形', description: '～ました、～だった。' },
      { title: '未来表現', description: '～するつもり、～でしょう。' },
      { title: '可算・不可算名詞', description: 'いくつ、たくさん。' },
      { title: '可能・義務の助動詞', description: '～できる、～なければならない。' },
      { title: '進行形', description: '～しています。' },
      { title: '頻度副詞', description: 'いつも、よく、ときどき、ぜんぜん。' },
      { title: '目的語の代名詞', description: 'わたしを、あなたを、かれを等。' },
      { title: '時間の助詞', description: '～に、～から、～まで。' },
      { title: '付加疑問', description: '～ですね？' },
    ],
    vocabulary: [
      { title: '旅行', description: '電車、切符、出発...' },
      { title: '祭り', description: '誕生日、正月...' },
      { title: '健康', description: '医者、病気、薬...' },
      { title: '服と色', description: 'ズボン、シャツ、青、赤...' },
      { title: '仕事と職業', description: 'オフィス、同僚、上司...' },
      { title: '手紙とメール', description: '手紙、メール...' },
      { title: '予定と約束', description: '約束、時間...' },
    ],
  },
  {
    level: 'B1',
    grammar: [
      { title: '過去進行形', description: '～していました。' },
      { title: '条件文', description: 'もし～なら、～たら。' },
      { title: '関係代名詞', description: '～の、だれ、なに、どこ。' },
      { title: '間接話法', description: '～と言いました。' },
      { title: '動詞の繰り返し', description: '見てみる、話してみる。' },
      { title: '最近完了', description: 'ちょうど～したところ。' },
      { title: '再帰動詞', description: '自分...' },
      { title: '受け身', description: '～される。' },
      { title: '疑問構文', description: 'どうやって、いくつ、なぜ...' },
      { title: '形容詞の順序', description: '大きくてきれいな家。' },
    ],
    vocabulary: [
      { title: '仕事とキャリア', description: '仕事、応募、上司...' },
      { title: '教育', description: '学校、大学...' },
      { title: '社会と文化', description: '文化、メディア...' },
      { title: '自然と環境', description: '自然、環境...' },
      { title: '物語と出来事', description: '物語、出来事...' },
      { title: '感情と意見', description: '感情、意見...' },
    ],
  },
  {
    level: 'B2',
    grammar: [
      { title: '過去完了', description: '～したことがある。' },
      { title: '仮定法', description: 'もし～だったらよかったのに。' },
      { title: '推量・仮説', description: 'かもしれない、たぶん。' },
      { title: '使役構文', description: '～させる。' },
      { title: '願望表現', description: '～したい、～してほしい。' },
      { title: '倒置文', description: '決して見たことがない...' },
      { title: '接続詞', description: 'しかし、けれども、にもかかわらず。' },
      { title: '強調構文', description: '～のは...だ。' },
      { title: 'コロケーション', description: '決断を下す、宿題をする。' },
      { title: '動詞＋助詞の組み合わせ', description: '出かける、通う...' },
    ],
    vocabulary: [
      { title: 'ビジネスと金融', description: 'ビジネス、お金、銀行...' },
      { title: '科学と技術', description: '技術、研究...' },
      { title: '旅行と文化', description: '旅行、観光...' },
      { title: '経済', description: '経済、金融...' },
      { title: '健康とスポーツ', description: '健康、栄養、運動...' },
      { title: '人間関係', description: '友情、関係...' },
    ],
  },
  {
    level: 'C1',
    grammar: [
      { title: '高度な受け身', description: '～と言われている、～と思われている。' },
      { title: '複雑な文型', description: '複数の従属節。' },
      { title: 'フォーマル・インフォーマルな表現', description: '場面に応じたスタイル。' },
      { title: '慣用句と定型表現', description: '猫の手も借りたい、頭が切れる。' },
      { title: '議論と意見表現', description: '賛成・反対の様々な表現。' },
      { title: '名詞化', description: '動詞・形容詞を名詞にする。' },
    ],
    vocabulary: [
      { title: 'アカデミックな語彙', description: '研究、分析、論文...' },
      { title: 'ビジネスコミュニケーション', description: '交渉、プレゼンテーション...' },
      { title: 'メディア', description: '新聞、放送、メディア...' },
      { title: '政治と社会', description: '政府、社会、選挙...' },
      { title: 'エコロジーと環境', description: '気候変動、環境保護...' },
      { title: '文化と芸術', description: '文学、演劇、芸術...' },
    ],
  },
  {
    level: 'C2',
    grammar: [
      { title: '複雑な構造の習得', description: '多層構造、高度な文型。' },
      { title: 'スタイルとレジスターの微妙な違い', description: 'フォーマル、インフォーマル、アカデミック。' },
      { title: 'すべての時制・態の柔軟な運用', description: '現在、過去、未来、受け身など。' },
      { title: '高度な慣用句・ことわざ', description: 'ことわざ、慣用句。' },
      { title: '抽象的な議論', description: '哲学、芸術、政治。' },
      { title: 'テキスト分析と解釈', description: '文学批評、エッセイ。' },
    ],
    vocabulary: [
      { title: '抽象的・哲学的概念', description: '倫理、美学、正義...' },
      { title: '高度な専門語彙', description: '法律、医学、技術...' },
      { title: '文学・芸術用語', description: 'メタファー、シンボル...' },
      { title: '異文化コミュニケーション', description: '異文化、グローバル化...' },
      { title: '現代のトレンド', description: 'デジタル化、イノベーション...' },
      { title: 'ディベート・議論表現', description: '意見を述べる、反対する...' },
    ],
  },
]; 
