// Структурированный учебный план для английского языка по уровням
export type Topic = { title: string; description?: string };
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CurriculumStage = {
  level: Level;
  grammar: Topic[];
  vocabulary: Topic[];
};

export const englishCurriculum: CurriculumStage[] = [
  {
    level: 'A1',
    grammar: [
      { title: 'Personal pronouns and verb to be', description: 'I, you, he/she/it, we, they; am, is, are.' },
      { title: 'Simple Present', description: 'Regular verbs, questions and negatives.' },
      { title: 'Articles: a/an, the', description: 'Indefinite and definite articles.' },
      { title: 'There is/are', description: 'Describing existence.' },
      { title: 'Possessive adjectives', description: 'my, your, his, her, our, their.' },
      { title: 'Imperatives', description: 'Giving simple instructions.' },
      { title: 'Can/can\'t for ability', description: 'Expressing ability and inability.' },
      { title: 'Prepositions of place', description: 'in, on, under, next to, between.' },
      { title: 'Plural nouns', description: 'Regular and irregular plurals.' },
      { title: 'Simple questions', description: 'Who, what, where, when, how.' },
    ],
    vocabulary: [
      { title: 'Greetings and introductions', description: 'Hello, Good morning, Goodbye...' },
      { title: 'Family', description: 'Mother, father, brother, sister...' },
      { title: 'Numbers', description: 'one, two, three...' },
      { title: 'Professions', description: 'Teacher, doctor, student...' },
      { title: 'Food and drinks', description: 'Bread, water, apple...' },
      { title: 'Weather', description: 'Sun, rain, snow...' },
      { title: 'Days and months', description: 'Monday, January...' },
      { title: 'City and transport', description: 'Bus, station, street...' },
      { title: 'Home and furniture', description: 'Table, chair, room...' },
      { title: 'Shopping', description: 'Buy, price, supermarket...' },
    ],
  },
  {
    level: 'A2',
    grammar: [
      { title: 'Comparatives and superlatives', description: 'bigger, the biggest.' },
      { title: 'Past Simple', description: 'Regular and irregular verbs.' },
      { title: 'Future with will/going to', description: 'Expressing future plans.' },
      { title: 'Countable and uncountable nouns', description: 'some, any, much, many.' },
      { title: 'Modal verbs: must, should', description: 'Expressing obligation and advice.' },
      { title: 'Present Continuous', description: 'Actions happening now.' },
      { title: 'Adverbs of frequency', description: 'always, usually, sometimes, never.' },
      { title: 'Object pronouns', description: 'me, you, him, her, us, them.' },
      { title: 'Prepositions of time', description: 'at, in, on.' },
      { title: 'Question tags', description: "isn't it?, don't you?" },
    ],
    vocabulary: [
      { title: 'Travel', description: 'Train, ticket, depart...' },
      { title: 'Holidays', description: 'Birthday, Christmas...' },
      { title: 'Health', description: 'Doctor, illness, tablet...' },
      { title: 'Clothes and colors', description: 'Trousers, shirt, blue, red...' },
      { title: 'Work and jobs', description: 'Office, colleague, boss...' },
      { title: 'Letters and emails', description: 'Letter, email...' },
      { title: 'Schedules and appointments', description: 'Appointment, time...' },
    ],
  },
  {
    level: 'B1',
    grammar: [
      { title: 'Present Perfect', description: 'Have/has + past participle.' },
      { title: 'First and second conditionals', description: 'If I go..., If I were you...' },
      { title: 'Relative clauses', description: 'who, which, that.' },
      { title: 'Reported speech', description: 'He said that...' },
      { title: 'Gerunds and infinitives', description: 'like doing, want to do.' },
      { title: 'Past Continuous', description: 'I was doing...' },
      { title: 'Modal verbs for possibility', description: 'might, may, could.' },
      { title: 'Passive voice', description: 'The book was written by...' },
      { title: 'Question forms', description: 'How long, How much, etc.' },
      { title: 'Adjective order', description: 'A big red car.' },
    ],
    vocabulary: [
      { title: 'Work and career', description: 'Job, application, boss...' },
      { title: 'Education', description: 'School, university...' },
      { title: 'Society and culture', description: 'Culture, media...' },
      { title: 'Nature and environment', description: 'Nature, environment...' },
      { title: 'Stories and events', description: 'Story, event...' },
      { title: 'Feelings and opinions', description: 'Feeling, opinion...' },
    ],
  },
  {
    level: 'B2',
    grammar: [
      { title: 'Past Perfect', description: 'I had done...' },
      { title: 'Third conditional', description: 'If I had known...' },
      { title: 'Modal verbs for deduction', description: 'must have, can't have.' },
      { title: 'Causative', description: 'have/get something done.' },
      { title: 'Wish/If only', description: 'I wish I had...' },
      { title: 'Inversion', description: 'Never have I seen...' },
      { title: 'Linking words', description: 'however, although, despite.' },
      { title: 'Emphasis', description: 'do/did for emphasis.' },
      { title: 'Collocations', description: 'make a decision, do homework.' },
      { title: 'Phrasal verbs', description: 'give up, look after.' },
    ],
    vocabulary: [
      { title: 'Business and finance', description: 'Business, money, bank...' },
      { title: 'Science and technology', description: 'Technology, research...' },
      { title: 'Travel and culture', description: 'Travel, sightseeing...' },
      { title: 'Economy', description: 'Economy, finance...' },
      { title: 'Health and sport', description: 'Fitness, nutrition, health...' },
      { title: 'Relationships', description: 'Friendship, partnership...' },
    ],
  },
  {
    level: 'C1',
    grammar: [
      { title: 'Advanced passive', description: 'It is said that..., He is thought to...' },
      { title: 'Complex sentence structures', description: 'Long subordinate clauses.' },
      { title: 'Formal and informal register', description: 'Using appropriate style.' },
      { title: 'Idioms and fixed expressions', description: 'Break a leg, once in a blue moon.' },
      { title: 'Argumentation and expressing opinion', description: 'Various ways to agree/disagree.' },
      { title: 'Nominalisation', description: 'Turning verbs/adjectives into nouns.' },
    ],
    vocabulary: [
      { title: 'Academic vocabulary', description: 'Research, analysis, thesis...' },
      { title: 'Professional communication', description: 'Negotiation, presentation...' },
      { title: 'Media', description: 'Newspaper, broadcast, media...' },
      { title: 'Politics and society', description: 'Government, society, election...' },
      { title: 'Ecology and environment', description: 'Climate change, environmental protection...' },
      { title: 'Culture and art', description: 'Literature, theater, art...' },
    ],
  },
  {
    level: 'C2',
    grammar: [
      { title: 'Mastery of complex structures', description: 'Multi-level clauses, advanced constructions.' },
      { title: 'Subtlety of style and register', description: 'Formal, informal, academic style.' },
      { title: 'Flexible use of all tenses and voices', description: 'Present, past, future, passive, etc.' },
      { title: 'Advanced idiomatic expressions', description: 'Proverbs, sayings.' },
      { title: 'Abstract argumentation', description: 'Philosophy, art, politics.' },
      { title: 'Analysis and interpretation of texts', description: 'Literary criticism, essays.' },
    ],
    vocabulary: [
      { title: 'Abstract and philosophical concepts', description: 'Ethics, aesthetics, justice...' },
      { title: 'High-level professional vocabulary', description: 'Law, medicine, technology...' },
      { title: 'Literary and artistic terms', description: 'Metaphor, symbolism...' },
      { title: 'Intercultural communication', description: 'Interculturality, globalization...' },
      { title: 'Modern trends', description: 'Digitalization, innovation...' },
      { title: 'Debate and discussion expressions', description: 'Expressing opinion, disagreeing...' },
    ],
  },
]; 