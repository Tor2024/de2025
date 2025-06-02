// Структурированный учебный план для итальянского языка по уровням
export type Topic = { title: string; description?: string };
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CurriculumStage = {
  level: Level;
  grammar: Topic[];
  vocabulary: Topic[];
};

export const italianCurriculum: CurriculumStage[] = [
  {
    level: 'A1',
    grammar: [
      { title: 'Pronomi personali e il verbo essere/avere', description: 'io, tu, lui/lei, noi, voi, loro; sono, sei, è, abbiamo, avete, hanno.' },
      { title: 'Presente dei verbi regolari', description: 'Coniugazione dei verbi in -are, -ere, -ire.' },
      { title: 'Articoli determinativi e indeterminativi', description: 'il, lo, la, i, gli, le; un, uno, una.' },
      { title: 'Negazione', description: 'non, mai.' },
      { title: 'Aggettivi possessivi', description: 'mio, tuo, suo, nostro, vostro, loro.' },
      { title: 'Imperativo', description: 'Dai!, Ascolta!' },
      { title: 'Preposizioni di luogo', description: 'in, su, sotto, davanti, dietro.' },
      { title: 'Plurale dei nomi', description: 'regole generali ed eccezioni.' },
      { title: 'Domande semplici', description: 'Chi, che cosa, dove, quando, come.' },
      { title: 'Espressioni di base', description: 'C\'è, è, ecco.' },
    ],
    vocabulary: [
      { title: 'Saluti e presentazioni', description: 'Ciao, Buongiorno, Arrivederci...' },
      { title: 'Famiglia', description: 'Madre, padre, fratello, sorella...' },
      { title: 'Numeri', description: 'uno, due, tre...' },
      { title: 'Professioni', description: 'Insegnante, medico, studente...' },
      { title: 'Cibo e bevande', description: 'Pane, acqua, mela...' },
      { title: 'Meteo', description: 'Sole, pioggia, neve...' },
      { title: 'Giorni e mesi', description: 'Lunedì, gennaio...' },
      { title: 'Città e trasporti', description: 'Autobus, stazione, strada...' },
      { title: 'Casa e mobili', description: 'Tavolo, sedia, stanza...' },
      { title: 'Acquisti', description: 'Comprare, prezzo, supermercato...' },
    ],
  },
  {
    level: 'A2',
    grammar: [
      { title: 'Comparativo e superlativo', description: 'più... di, il più...' },
      { title: 'Passato prossimo', description: 'avere/essere + participio passato.' },
      { title: 'Futuro semplice', description: 'parlerò, andrò...' },
      { title: 'Nomi numerabili e non numerabili', description: 'del, della, dei, alcune.' },
      { title: 'Verbi modali: dovere, potere', description: 'Esprimere obbligo e possibilità.' },
      { title: 'Presente progressivo', description: 'stare + gerundio.' },
      { title: 'Avverbi di frequenza', description: 'sempre, spesso, qualche volta, mai.' },
      { title: 'Pronomi oggetto', description: 'mi, ti, lo, la, ci, vi, li, le.' },
      { title: 'Preposizioni di tempo', description: 'a, in, da.' },
      { title: 'Domande con tag', description: 'vero?, no?' },
    ],
    vocabulary: [
      { title: 'Viaggi', description: 'Treno, biglietto, partire...' },
      { title: 'Feste', description: 'Compleanno, Natale...' },
      { title: 'Salute', description: 'Medico, malattia, pillola...' },
      { title: 'Abbigliamento e colori', description: 'Pantalone, camicia, blu, rosso...' },
      { title: 'Lavoro e mestieri', description: 'Ufficio, collega, capo...' },
      { title: 'Lettere ed e-mail', description: 'Lettera, e-mail...' },
      { title: 'Orari e appuntamenti', description: 'Appuntamento, ora...' },
    ],
  },
  {
    level: 'B1',
    grammar: [
      { title: 'Imperfetto', description: 'facevo, andavi...' },
      { title: 'Condizionale presente', description: 'vorrei, ameresti...' },
      { title: 'Pronomi relativi', description: 'che, cui, dove.' },
      { title: 'Discorso indiretto', description: 'Ha detto che...' },
      { title: 'Gerundio', description: 'facendo...' },
      { title: 'Passato recente', description: 'appena + participio passato.' },
      { title: 'Verbi pronominali', description: 'alzarsi, chiamarsi...' },
      { title: 'Voce passiva', description: 'Il libro è stato scritto da...' },
      { title: 'Forme interrogative', description: 'Come, quanto, perché...' },
      { title: 'Ordine degli aggettivi', description: 'una grande casa bianca.' },
    ],
    vocabulary: [
      { title: 'Lavoro e carriera', description: 'Lavoro, candidatura, capo...' },
      { title: 'Educazione', description: 'Scuola, università...' },
      { title: 'Società e cultura', description: 'Cultura, media...' },
      { title: 'Natura e ambiente', description: 'Natura, ambiente...' },
      { title: 'Storie ed eventi', description: 'Storia, evento...' },
      { title: 'Sentimenti e opinioni', description: 'Sentimento, opinione...' },
    ],
  },
  {
    level: 'B2',
    grammar: [
      { title: 'Trapassato prossimo', description: 'avevo fatto...' },
      { title: 'Condizionale passato', description: 'avrei fatto...' },
      { title: 'Verbi modali per deduzione', description: 'dovere, potere al condizionale.' },
      { title: 'Causativo', description: 'far fare qualcosa.' },
      { title: 'Desideri', description: 'vorrei che...' },
      { title: 'Inversione', description: 'Mai ho visto...' },
      { title: 'Congiunzioni', description: 'tuttavia, sebbene, nonostante.' },
      { title: 'Enfasi', description: 'è... che/chi.' },
      { title: 'Collocazioni', description: 'prendere una decisione, fare i compiti.' },
      { title: 'Verbi con preposizione', description: 'andarsene, passare a...' },
    ],
    vocabulary: [
      { title: 'Affari e finanza', description: 'Affari, soldi, banca...' },
      { title: 'Scienza e tecnologia', description: 'Tecnologia, ricerca...' },
      { title: 'Viaggi e cultura', description: 'Viaggio, turismo...' },
      { title: 'Economia', description: 'Economia, finanza...' },
      { title: 'Salute e sport', description: 'Forma, nutrizione, salute...' },
      { title: 'Relazioni', description: 'Amicizia, relazione...' },
    ],
  },
  {
    level: 'C1',
    grammar: [
      { title: 'Passivo avanzato', description: 'Si dice che..., Si pensa che...' },
      { title: 'Strutture complesse', description: 'Subordinate lunghe.' },
      { title: 'Registro formale e informale', description: 'Uso dello stile appropriato.' },
      { title: 'Modi di dire e espressioni fisse', description: 'Avere le mani bucate, essere al settimo cielo.' },
      { title: 'Argomentazione ed espressione di opinione', description: 'Modi diversi di essere d\'accordo o meno.' },
      { title: 'Nominalizzazione', description: 'Trasformare verbi/aggettivi in nomi.' },
    ],
    vocabulary: [
      { title: 'Vocabolario accademico', description: 'Ricerca, analisi, tesi...' },
      { title: 'Comunicazione professionale', description: 'Negoziazione, presentazione...' },
      { title: 'Media', description: 'Giornale, trasmissione, media...' },
      { title: 'Politica e società', description: 'Governo, società, elezione...' },
      { title: 'Ecologia e ambiente', description: 'Cambiamento climatico, protezione ambientale...' },
      { title: 'Cultura e arte', description: 'Letteratura, teatro, arte...' },
    ],
  },
  {
    level: 'C2',
    grammar: [
      { title: 'Padronanza delle strutture complesse', description: 'Proposizioni multilivello, costruzioni avanzate.' },
      { title: 'Sfumature di stile e registro', description: 'Stile formale, informale, accademico.' },
      { title: 'Uso flessibile di tutti i tempi e voci', description: 'Presente, passato, futuro, passivo, ecc.' },
      { title: 'Espressioni idiomatiche avanzate', description: 'Proverbi, detti.' },
      { title: 'Argomentazione astratta', description: 'Filosofia, arte, politica.' },
      { title: 'Analisi e interpretazione di testi', description: 'Critica letteraria, saggi.' },
    ],
    vocabulary: [
      { title: 'Concetti astratti e filosofici', description: 'Etica, estetica, giustizia...' },
      { title: 'Vocabolario professionale di alto livello', description: 'Diritto, medicina, tecnologia...' },
      { title: 'Termini letterari e artistici', description: 'Metafora, simbolismo...' },
      { title: 'Comunicazione interculturale', description: 'Interculturalità, globalizzazione...' },
      { title: 'Tendenze moderne', description: 'Digitalizzazione, innovazione...' },
      { title: 'Espressioni per dibattito e discussione', description: 'Esprimere opinione, dissentire...' },
    ],
  },
]; 