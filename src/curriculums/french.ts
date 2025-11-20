// Структурированный учебный план для французского языка по уровням
export type Topic = { title: string; description?: string };
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CurriculumStage = {
  level: Level;
  grammar: Topic[];
  vocabulary: Topic[];
};

export const frenchCurriculum: CurriculumStage[] = [
  {
    level: 'A1',
    grammar: [
      { title: 'Les pronoms personnels et le verbe être/avoir', description: 'je, tu, il/elle, nous, vous, ils/elles; suis, es, est, avons, avez, ont.' },
      { title: 'Présent des verbes réguliers', description: 'Conjugaison des verbes en -er.' },
      { title: 'Articles définis et indéfinis', description: 'le, la, les; un, une, des.' },
      { title: 'Négation', description: 'ne...pas.' },
      { title: 'Adjectifs possessifs', description: 'mon, ma, mes, ton, ta, tes.' },
      { title: 'Impératif', description: 'Donne-moi, écoutez.' },
      { title: 'Prépositions de lieu', description: 'dans, sur, sous, devant, derrière.' },
      { title: 'Pluriel des noms', description: 'règles générales et exceptions.' },
      { title: 'Questions simples', description: 'Qui, quoi, où, quand, comment.' },
      { title: 'Expressions de base', description: 'Il y a, c’est, voilà.' },
    ],
    vocabulary: [
      { title: 'Salutations et présentations', description: 'Bonjour, Salut, Au revoir...' },
      { title: 'Famille', description: 'Mère, père, frère, sœur...' },
      { title: 'Nombres', description: 'un, deux, trois...' },
      { title: 'Professions', description: 'Professeur, médecin, étudiant...' },
      { title: 'Nourriture et boissons', description: 'Pain, eau, pomme...' },
      { title: 'Météo', description: 'Soleil, pluie, neige...' },
      { title: 'Jours et mois', description: 'Lundi, janvier...' },
      { title: 'Ville et transport', description: 'Bus, gare, rue...' },
      { title: 'Maison et meubles', description: 'Table, chaise, chambre...' },
      { title: 'Achats', description: 'Acheter, prix, supermarché...' },
    ],
  },
  {
    level: 'A2',
    grammar: [
      { title: 'Comparatif et superlatif', description: 'plus... que, le plus...' },
      { title: 'Passé composé', description: 'Avoir/être + participe passé.' },
      { title: 'Futur proche', description: 'aller + infinitif.' },
      { title: 'Noms dénombrables et indénombrables', description: 'du, de la, des, quelques.' },
      { title: 'Verbes modaux: devoir, pouvoir', description: 'Exprimer l’obligation et la possibilité.' },
      { title: 'Présent progressif', description: 'être en train de.' },
      { title: 'Adverbes de fréquence', description: 'toujours, souvent, parfois, jamais.' },
      { title: 'Pronoms objets', description: 'me, te, le, la, nous, vous, les.' },
      { title: 'Prépositions de temps', description: 'à, en, depuis.' },
      { title: 'Tags interrogatifs', description: 'n’est-ce pas ?' },
    ],
    vocabulary: [
      { title: 'Voyages', description: 'Train, billet, partir...' },
      { title: 'Fêtes', description: 'Anniversaire, Noël...' },
      { title: 'Santé', description: 'Médecin, maladie, comprimé...' },
      { title: 'Vêtements et couleurs', description: 'Pantalon, chemise, bleu, rouge...' },
      { title: 'Travail et métiers', description: 'Bureau, collègue, patron...' },
      { title: 'Lettres et e-mails', description: 'Lettre, e-mail...' },
      { title: 'Horaires et rendez-vous', description: 'Rendez-vous, heure...' },
    ],
  },
  {
    level: 'B1',
    grammar: [
      { title: 'Imparfait', description: 'je faisais, tu allais...' },
      { title: 'Conditionnel présent', description: 'je voudrais, tu aimerais...' },
      { title: 'Pronoms relatifs', description: 'qui, que, où.' },
      { title: 'Discours indirect', description: 'Il a dit que...' },
      { title: 'Gérondif', description: 'en faisant...' },
      { title: 'Passé récent', description: 'venir de + infinitif.' },
      { title: 'Verbes pronominaux', description: 'se lever, s’appeler...' },
      { title: 'Voix passive', description: 'Le livre a été écrit par...' },
      { title: 'Formes interrogatives', description: 'Comment, combien, pourquoi...' },
      { title: 'Ordre des adjectifs', description: 'une grande maison blanche.' },
    ],
    vocabulary: [
      { title: 'Travail et carrière', description: 'Emploi, candidature, patron...' },
      { title: 'Éducation', description: 'École, université...' },
      { title: 'Société et culture', description: 'Culture, médias...' },
      { title: 'Nature et environnement', description: 'Nature, environnement...' },
      { title: 'Histoires et événements', description: 'Histoire, événement...' },
      { title: 'Sentiments et opinions', description: 'Sentiment, opinion...' },
    ],
  },
  {
    level: 'B2',
    grammar: [
      { title: 'Plus-que-parfait', description: 'j’avais fait...' },
      { title: 'Conditionnel passé', description: 'j’aurais fait...' },
      { title: 'Verbes modaux pour la déduction', description: 'devoir, pouvoir au conditionnel.' },
      { title: 'Causatif', description: 'faire faire quelque chose.' },
      { title: 'Souhaits', description: 'je souhaiterais que...' },
      { title: 'Inversion', description: 'Jamais n’ai-je vu...' },
      { title: 'Mots de liaison', description: 'cependant, bien que, malgré.' },
      { title: 'Emphase', description: 'c’est... qui/que.' },
      { title: 'Collocations', description: 'prendre une décision, faire les devoirs.' },
      { title: 'Verbes à particule', description: 's’en sortir, passer à...' },
    ],
    vocabulary: [
      { title: 'Affaires et finance', description: 'Affaires, argent, banque...' },
      { title: 'Science et technologie', description: 'Technologie, recherche...' },
      { title: 'Voyages et culture', description: 'Voyage, tourisme...' },
      { title: 'Économie', description: 'Économie, finance...' },
      { title: 'Santé et sport', description: 'Forme, nutrition, santé...' },
      { title: 'Relations', description: 'Amitié, partenariat...' },
    ],
  },
  {
    level: 'C1',
    grammar: [
      { title: 'Passif avancé', description: 'Il est dit que..., On pense que...' },
      { title: 'Structures complexes', description: 'Subordonnées longues.' },
      { title: 'Registre formel et informel', description: 'Utilisation du style approprié.' },
      { title: 'Idiomes et expressions figées', description: 'Donner sa langue au chat, avoir le cafard.' },
      { title: 'Argumentation et expression d’opinion', description: 'Différentes façons d’être d’accord/pas d’accord.' },
      { title: 'Nominalisation', description: 'Transformer des verbes/adjectifs en noms.' },
    ],
    vocabulary: [
      { title: 'Vocabulaire académique', description: 'Recherche, analyse, thèse...' },
      { title: 'Communication professionnelle', description: 'Négociation, présentation...' },
      { title: 'Médias', description: 'Journal, diffusion, médias...' },
      { title: 'Politique et société', description: 'Gouvernement, société, élection...' },
      { title: 'Écologie et environnement', description: 'Changement climatique, protection de l’environnement...' },
      { title: 'Culture et art', description: 'Littérature, théâtre, art...' },
    ],
  },
  {
    level: 'C2',
    grammar: [
      { title: 'Maîtrise des structures complexes', description: 'Propositions à plusieurs niveaux, constructions avancées.' },
      { title: 'Subtilité du style et du registre', description: 'Style formel, informel, académique.' },
      { title: 'Utilisation flexible de tous les temps et voix', description: 'Présent, passé, futur, passif, etc.' },
      { title: 'Expressions idiomatiques avancées', description: 'Proverbes, dictons.' },
      { title: 'Argumentation abstraite', description: 'Philosophie, art, politique.' },
      { title: 'Analyse et interprétation de textes', description: 'Critique littéraire, essais.' },
    ],
    vocabulary: [
      { title: 'Concepts abstraits et philosophiques', description: 'Éthique, esthétique, justice...' },
      { title: 'Vocabulaire professionnel de haut niveau', description: 'Droit, médecine, technologie...' },
      { title: 'Termes littéraires et artistiques', description: 'Métaphore, symbolisme...' },
      { title: 'Communication interculturelle', description: 'Interculturalité, mondialisation...' },
      { title: 'Tendances modernes', description: 'Numérisation, innovation...' },
      { title: 'Expressions pour le débat et la discussion', description: 'Exprimer une opinion, être en désaccord...' },
    ],
  },
]; 
