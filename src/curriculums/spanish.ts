// Структурированный учебный план для испанского языка по уровням
export type Topic = { title: string; description?: string };
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CurriculumStage = {
  level: Level;
  grammar: Topic[];
  vocabulary: Topic[];
};

export const spanishCurriculum: CurriculumStage[] = [
  {
    level: 'A1',
    grammar: [
      { title: 'Pronombres personales y el verbo ser/estar', description: 'yo, tú, él/ella, nosotros, vosotros, ellos; soy, eres, es, estamos, están.' },
      { title: 'Presente de los verbos regulares', description: 'Conjugación de verbos en -ar, -er, -ir.' },
      { title: 'Artículos definidos e indefinidos', description: 'el, la, los, las; un, una, unos, unas.' },
      { title: 'Negación', description: 'no, nunca.' },
      { title: 'Adjetivos posesivos', description: 'mi, tu, su, nuestro, vuestro, su.' },
      { title: 'Imperativo', description: '¡Ven!, ¡Escucha!' },
      { title: 'Preposiciones de lugar', description: 'en, sobre, bajo, delante, detrás.' },
      { title: 'Plural de los sustantivos', description: 'reglas generales y excepciones.' },
      { title: 'Preguntas simples', description: 'Quién, qué, dónde, cuándo, cómo.' },
      { title: 'Expresiones básicas', description: 'Hay, es, está.' },
    ],
    vocabulary: [
      { title: 'Saludos y presentaciones', description: 'Hola, Buenos días, Adiós...' },
      { title: 'Familia', description: 'Madre, padre, hermano, hermana...' },
      { title: 'Números', description: 'uno, dos, tres...' },
      { title: 'Profesiones', description: 'Profesor, médico, estudiante...' },
      { title: 'Comida y bebidas', description: 'Pan, agua, manzana...' },
      { title: 'Clima', description: 'Sol, lluvia, nieve...' },
      { title: 'Días y meses', description: 'Lunes, enero...' },
      { title: 'Ciudad y transporte', description: 'Autobús, estación, calle...' },
      { title: 'Casa y muebles', description: 'Mesa, silla, habitación...' },
      { title: 'Compras', description: 'Comprar, precio, supermercado...' },
    ],
  },
  {
    level: 'A2',
    grammar: [
      { title: 'Comparativo y superlativo', description: 'más... que, el más...' },
      { title: 'Pretérito perfecto', description: 'haber + participio.' },
      { title: 'Futuro próximo', description: 'ir a + infinitivo.' },
      { title: 'Sustantivos contables e incontables', description: 'algo de, algunos, muchas.' },
      { title: 'Verbos modales: deber, poder', description: 'Expresar obligación y posibilidad.' },
      { title: 'Presente progresivo', description: 'estar + gerundio.' },
      { title: 'Adverbios de frecuencia', description: 'siempre, a menudo, a veces, nunca.' },
      { title: 'Pronombres de objeto', description: 'me, te, lo, la, nos, os, los, las.' },
      { title: 'Preposiciones de tiempo', description: 'a, en, desde.' },
      { title: 'Coletillas interrogativas', description: '¿verdad?, ¿no?' },
    ],
    vocabulary: [
      { title: 'Viajes', description: 'Tren, billete, salir...' },
      { title: 'Fiestas', description: 'Cumpleaños, Navidad...' },
      { title: 'Salud', description: 'Médico, enfermedad, pastilla...' },
      { title: 'Ropa y colores', description: 'Pantalón, camisa, azul, rojo...' },
      { title: 'Trabajo y profesiones', description: 'Oficina, colega, jefe...' },
      { title: 'Cartas y correos electrónicos', description: 'Carta, correo electrónico...' },
      { title: 'Horarios y citas', description: 'Cita, hora...' },
    ],
  },
  {
    level: 'B1',
    grammar: [
      { title: 'Pretérito imperfecto', description: 'yo hacía, tú ibas...' },
      { title: 'Condicional simple', description: 'me gustaría, te encantaría...' },
      { title: 'Oraciones relativas', description: 'que, quien, donde.' },
      { title: 'Estilo indirecto', description: 'Él dijo que...' },
      { title: 'Gerundio', description: 'haciendo...' },
      { title: 'Pretérito reciente', description: 'acabar de + infinitivo.' },
      { title: 'Verbos pronominales', description: 'levantarse, llamarse...' },
      { title: 'Voz pasiva', description: 'El libro fue escrito por...' },
      { title: 'Formas interrogativas', description: 'Cómo, cuánto, por qué...' },
      { title: 'Orden de los adjetivos', description: 'un coche rojo grande.' },
    ],
    vocabulary: [
      { title: 'Trabajo y carrera', description: 'Empleo, solicitud, jefe...' },
      { title: 'Educación', description: 'Escuela, universidad...' },
      { title: 'Sociedad y cultura', description: 'Cultura, medios...' },
      { title: 'Naturaleza y medio ambiente', description: 'Naturaleza, medio ambiente...' },
      { title: 'Historias y eventos', description: 'Historia, evento...' },
      { title: 'Sentimientos y opiniones', description: 'Sentimiento, opinión...' },
    ],
  },
  {
    level: 'B2',
    grammar: [
      { title: 'Pretérito pluscuamperfecto', description: 'yo había hecho...' },
      { title: 'Condicional compuesto', description: 'yo habría hecho...' },
      { title: 'Verbos modales para deducción', description: 'deber, poder en condicional.' },
      { title: 'Causativo', description: 'hacer que alguien haga algo.' },
      { title: 'Deseos', description: 'desearía que...' },
      { title: 'Inversión', description: 'Jamás he visto...' },
      { title: 'Conectores', description: 'sin embargo, aunque, a pesar de.' },
      { title: 'Énfasis', description: 'es... quien/que.' },
      { title: 'Colocaciones', description: 'tomar una decisión, hacer los deberes.' },
      { title: 'Verbos con preposición', description: 'salir de, pasar a...' },
    ],
    vocabulary: [
      { title: 'Negocios y finanzas', description: 'Negocios, dinero, banco...' },
      { title: 'Ciencia y tecnología', description: 'Tecnología, investigación...' },
      { title: 'Viajes y cultura', description: 'Viaje, turismo...' },
      { title: 'Economía', description: 'Economía, finanzas...' },
      { title: 'Salud y deporte', description: 'Forma, nutrición, salud...' },
      { title: 'Relaciones', description: 'Amistad, pareja...' },
    ],
  },
  {
    level: 'C1',
    grammar: [
      { title: 'Pasiva avanzada', description: 'Se dice que..., Se piensa que...' },
      { title: 'Estructuras complejas', description: 'Oraciones subordinadas largas.' },
      { title: 'Registro formal e informal', description: 'Uso del estilo apropiado.' },
      { title: 'Modismos y expresiones fijas', description: 'Estar en las nubes, tirar la toalla.' },
      { title: 'Argumentación y expresión de opinión', description: 'Diferentes formas de estar de acuerdo o no.' },
      { title: 'Nominalización', description: 'Transformar verbos/adjetivos en sustantivos.' },
    ],
    vocabulary: [
      { title: 'Vocabulario académico', description: 'Investigación, análisis, tesis...' },
      { title: 'Comunicación profesional', description: 'Negociación, presentación...' },
      { title: 'Medios', description: 'Periódico, emisión, medios...' },
      { title: 'Política y sociedad', description: 'Gobierno, sociedad, elección...' },
      { title: 'Ecología y medio ambiente', description: 'Cambio climático, protección ambiental...' },
      { title: 'Cultura y arte', description: 'Literatura, teatro, arte...' },
    ],
  },
  {
    level: 'C2',
    grammar: [
      { title: 'Dominio de estructuras complejas', description: 'Oraciones multinivel, construcciones avanzadas.' },
      { title: 'Sutileza de estilo y registro', description: 'Estilo formal, informal, académico.' },
      { title: 'Uso flexible de todos los tiempos y voces', description: 'Presente, pasado, futuro, pasiva, etc.' },
      { title: 'Expresiones idiomáticas avanzadas', description: 'Proverbios, dichos.' },
      { title: 'Argumentación abstracta', description: 'Filosofía, arte, política.' },
      { title: 'Análisis e interpretación de textos', description: 'Crítica literaria, ensayos.' },
    ],
    vocabulary: [
      { title: 'Conceptos abstractos y filosóficos', description: 'Ética, estética, justicia...' },
      { title: 'Vocabulario profesional de alto nivel', description: 'Derecho, medicina, tecnología...' },
      { title: 'Términos literarios y artísticos', description: 'Metáfora, simbolismo...' },
      { title: 'Comunicación intercultural', description: 'Interculturalidad, globalización...' },
      { title: 'Tendencias modernas', description: 'Digitalización, innovación...' },
      { title: 'Expresiones para debate y discusión', description: 'Expresar opinión, disentir...' },
    ],
  },
]; 