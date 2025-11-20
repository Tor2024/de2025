// Структурированный учебный план для португальского языка по уровням
export type Topic = { title: string; description?: string };
export type Level = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CurriculumStage = {
  level: Level;
  grammar: Topic[];
  vocabulary: Topic[];
};

export const portugueseCurriculum: CurriculumStage[] = [
  {
    level: 'A0',
    grammar: [
        { title: 'Португальский алфавит', description: 'Изучение букв и их названий.' },
        { title: 'Основы произношения', description: 'Носовые звуки, правила чтения -s, -z, -x, -ch, -lh.' },
        { title: 'Личные местоимения (единственное число)', description: 'eu, tu, ele, ela, você (я, ты, он, она, вы).' },
        { title: 'Глагол "ser" (быть, постоянный признак)', description: 'eu sou, tu és, ele/ela é.' },
        { title: 'Глагол "estar" (быть, временное состояние)', description: 'eu estou, tu estás, ele/ela está.' },
    ],
    vocabulary: [
        { title: 'Приветствия и прощания', description: 'Olá, Bom dia, Adeus, Tchau.' },
        { title: 'Знакомство', description: 'Como se chama?, Chamo-me...' },
        { title: 'Слова "Да" и "Нет"', description: 'Sim, Não.' },
        { title: 'Числа от 0 до 10', description: 'zero, um, dois, três, quatro, cinco, seis, sete, oito, nove, dez.' },
        { title: 'Простые вежливые фразы', description: 'Por favor, Obrigado/Obrigada (спасибо м/ж), Desculpe (извините).' },
    ],
  },
  {
    level: 'A1',
    grammar: [
      { title: 'Pronomes pessoais e o verbo ser/estar', description: 'eu, tu, ele/ela, nós, vós, eles/elas; sou, és, é, estamos, estão.' },
      { title: 'Presente dos verbos regulares', description: 'Conjugação de verbos em -ar, -er, -ir.' },
      { title: 'Artigos definidos e indefinidos', description: 'o, a, os, as; um, uma, uns, umas.' },
      { title: 'Negação', description: 'não, nunca.' },
      { title: 'Adjetivos possessivos', description: 'meu, teu, seu, nosso, vosso, seu.' },
      { title: 'Imperativo', description: 'Vem!, Ouça!' },
      { title: 'Preposições de lugar', description: 'em, sobre, sob, diante, atrás.' },
      { title: 'Plural dos substantivos', description: 'reglas gerais e exceções.' },
      { title: 'Perguntas simples', description: 'Quem, o que, onde, quando, como.' },
      { title: 'Expressões básicas', description: 'Há, é, está.' },
    ],
    vocabulary: [
      { title: 'Saudações e apresentações', description: 'Olá, Bom dia, Adeus...' },
      { title: 'Família', description: 'Mãe, pai, irmão, irmã...' },
      { title: 'Números', description: 'um, dois, três...' },
      { title: 'Profissões', description: 'Professor, médico, estudante...' },
      { title: 'Comida e bebidas', description: 'Pão, água, maçã...' },
      { title: 'Clima', description: 'Sol, chuva, neve...' },
      { title: 'Dias e meses', description: 'Segunda-feira, janeiro...' },
      { title: 'Cidade e transporte', description: 'Ônibus, estação, rua...' },
      { title: 'Casa e móveis', description: 'Mesa, cadeira, quarto...' },
      { title: 'Compras', description: 'Comprar, preço, supermercado...' },
    ],
  },
  {
    level: 'A2',
    grammar: [
      { title: 'Comparativo e superlativo', description: 'mais... que, o mais...' },
      { title: 'Pretérito perfeito', description: 'ter + particípio.' },
      { title: 'Futuro próximo', description: 'ir + infinitivo.' },
      { title: 'Substantivos contáveis e incontáveis', description: 'algum, alguns, muita.' },
      { title: 'Verbos modais: dever, poder', description: 'Expressar obrigação e possibilidade.' },
      { title: 'Presente progressivo', description: 'estar + gerúndio.' },
      { title: 'Advérbios de frequência', description: 'sempre, frequentemente, às vezes, nunca.' },
      { title: 'Pronomes objeto', description: 'me, te, o, a, nos, vos, os, as.' },
      { title: 'Preposições de tempo', description: 'a, em, desde.' },
      { title: 'Perguntas com tag', description: 'não é?, certo?' },
    ],
    vocabulary: [
      { title: 'Viagens', description: 'Trem, bilhete, partir...' },
      { title: 'Festas', description: 'Aniversário, Natal...' },
      { title: 'Saúde', description: 'Médico, doença, comprimido...' },
      { title: 'Roupas e cores', description: 'Calça, camisa, azul, vermelho...' },
      { title: 'Trabalho e profissões', description: 'Escritório, colega, chefe...' },
      { title: 'Cartas e e-mails', description: 'Carta, e-mail...' },
      { title: 'Horários e compromissos', description: 'Compromisso, hora...' },
    ],
  },
  {
    level: 'B1',
    grammar: [
      { title: 'Pretérito imperfeito', description: 'eu fazia, tu ias...' },
      { title: 'Condicional simples', description: 'eu gostaria, tu gostarias...' },
      { title: 'Orações relativas', description: 'que, quem, onde.' },
      { title: 'Discurso indireto', description: 'Ele disse que...' },
      { title: 'Gerúndio', description: 'fazendo...' },
      { title: 'Pretérito recente', description: 'acabar de + infinitivo.' },
      { title: 'Verbos pronominais', description: 'levantar-se, chamar-se...' },
      { title: 'Voz passiva', description: 'O livro foi escrito por...' },
      { title: 'Formas interrogativas', description: 'Como, quanto, por quê...' },
      { title: 'Ordem dos adjetivos', description: 'um carro vermelho grande.' },
    ],
    vocabulary: [
      { title: 'Trabalho e carreira', description: 'Emprego, candidatura, chefe...' },
      { title: 'Educação', description: 'Escola, universidade...' },
      { title: 'Sociedade e cultura', description: 'Cultura, mídia...' },
      { title: 'Natureza e meio ambiente', description: 'Natureza, meio ambiente...' },
      { title: 'Histórias e eventos', description: 'História, evento...' },
      { title: 'Sentimentos e opiniões', description: 'Sentimento, opinião...' },
    ],
  },
  {
    level: 'B2',
    grammar: [
      { title: 'Mais-que-perfeito', description: 'eu tinha feito...' },
      { title: 'Condicional composto', description: 'eu teria feito...' },
      { title: 'Verbos modais para dedução', description: 'dever, poder no condicional.' },
      { title: 'Causativo', description: 'fazer alguém fazer algo.' },
      { title: 'Desejos', description: 'eu desejaria que...' },
      { title: 'Inversão', description: 'Jamais vi...' },
      { title: 'Conectores', description: 'no entanto, embora, apesar de.' },
      { title: 'Ênfase', description: 'é... quem/que.' },
      { title: 'Colocações', description: 'tomar uma decisão, fazer o dever de casa.' },
      { title: 'Verbos com preposição', description: 'sair de, passar a...' },
    ],
    vocabulary: [
      { title: 'Negócios e finanças', description: 'Negócios, dinheiro, banco...' },
      { title: 'Ciência e tecnologia', description: 'Tecnologia, pesquisa...' },
      { title: 'Viagens e cultura', description: 'Viagem, turismo...' },
      { title: 'Economia', description: 'Economia, finanças...' },
      { title: 'Saúde e esporte', description: 'Forma, nutrição, saúde...' },
      { title: 'Relações', description: 'Amizade, relacionamento...' },
    ],
  },
  {
    level: 'C1',
    grammar: [
      { title: 'Passiva avançada', description: 'Diz-se que..., Pensa-se que...' },
      { title: 'Estruturas complexas', description: 'Orações subordinadas longas.' },
      { title: 'Registro formal e informal', description: 'Uso do estilo apropriado.' },
      { title: 'Expressões idiomáticas e fixas', description: 'Estar nas nuvens, dar o braço a torcer.' },
      { title: 'Argumentação e expressão de opinião', description: 'Diferentes formas de concordar ou discordar.' },
      { title: 'Nominalização', description: 'Transformar verbos/adjetivos em substantivos.' },
    ],
    vocabulary: [
      { title: 'Vocabulário acadêmico', description: 'Pesquisa, análise, tese...' },
      { title: 'Comunicação profissional', description: 'Negociação, apresentação...' },
      { title: 'Mídia', description: 'Jornal, transmissão, mídia...' },
      { title: 'Política e sociedade', description: 'Governo, sociedade, eleição...' },
      { title: 'Ecologia e meio ambiente', description: 'Mudança climática, proteção ambiental...' },
      { title: 'Cultura e arte', description: 'Literatura, teatro, arte...' },
    ],
  },
  {
    level: 'C2',
    grammar: [
      { title: 'Domínio de estruturas complexas', description: 'Orações multinível, construções avançadas.' },
      { title: 'Sutileza de estilo e registro', description: 'Estilo formal, informal, acadêmico.' },
      { title: 'Uso flexível de todos os tempos e vozes', description: 'Presente, passado, futuro, passiva, etc.' },
      { title: 'Expressões idiomáticas avançadas', description: 'Provérbios, ditados.' },
      { title: 'Argumentação abstrata', description: 'Filosofia, arte, política.' },
      { title: 'Análise e interpretação de textos', description: 'Crítica literária, ensaios.' },
    ],
    vocabulary: [
      { title: 'Conceitos abstratos e filosóficos', description: 'Ética, estética, justiça...' },
      { title: 'Vocabulário profissional de alto nível', description: 'Direito, medicina, tecnologia...' },
      { title: 'Termos literários e artísticos', description: 'Metáfora, simbolismo...' },
      { title: 'Comunicação intercultural', description: 'Interculturalidade, globalização...' },
      { title: 'Tendências modernas', description: 'Digitalização, inovação...' },
      { title: 'Expressões para debate e discussão', description: 'Expressar opinião, discordar...' },
    ],
  },
];
