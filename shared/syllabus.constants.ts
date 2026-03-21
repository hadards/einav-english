export type ContentLevel = 'A2' | 'B1' | 'B2';
export type ContentType = 'grammar' | 'vocabulary';

export interface SyllabusEntry {
  id: string;
  type: ContentType;
  title: string;
  level: ContentLevel;
  order: number;
  assetPath: string;
  hebrewFocus: string[];
  tags: string[];
  unlocksAfter: string | null;
}

export const SYLLABUS: SyllabusEntry[] = [
  // ── A2 Grammar (14 lessons) ──────────────────────────────────────────────
  { id: 'G-01', type: 'grammar', title: 'Present simple', level: 'A2', order: 1, assetPath: 'lessons/G-01-present-simple.json', hebrewFocus: ['do/does auxiliaries', 'third-person -s'], tags: ['tense', 'present', 'basics'], unlocksAfter: null },
  { id: 'G-02', type: 'grammar', title: 'Past simple — regular', level: 'A2', order: 2, assetPath: 'lessons/G-02-past-simple-regular.json', hebrewFocus: ['-ed ending', 'suffix vs root-based'], tags: ['tense', 'past', 'basics'], unlocksAfter: 'G-01' },
  { id: 'G-03', type: 'grammar', title: 'Past simple — irregular', level: 'A2', order: 3, assetPath: 'lessons/G-03-past-simple-irregular.json', hebrewFocus: ['40 irregular verbs', 'memorisation'], tags: ['tense', 'past', 'irregular'], unlocksAfter: 'G-02' },
  { id: 'G-04', type: 'grammar', title: 'Present continuous', level: 'A2', order: 4, assetPath: 'lessons/G-04-present-continuous.json', hebrewFocus: ['no continuous in Hebrew', 'stative verbs'], tags: ['tense', 'present', 'continuous'], unlocksAfter: 'G-01' },
  { id: 'G-05', type: 'grammar', title: 'Future: will', level: 'A2', order: 5, assetPath: 'lessons/G-05-future-will.json', hebrewFocus: ['Hebrew uses present for future', 'will is new'], tags: ['tense', 'future'], unlocksAfter: 'G-01' },
  { id: 'G-06', type: 'grammar', title: 'Future: going to', level: 'A2', order: 6, assetPath: 'lessons/G-06-future-going-to.json', hebrewFocus: ['intention vs prediction', 'absent in Hebrew'], tags: ['tense', 'future'], unlocksAfter: 'G-05' },
  { id: 'G-07', type: 'grammar', title: 'Articles: a / an / the', level: 'A2', order: 7, assetPath: 'lessons/G-07-articles.json', hebrewFocus: ['Hebrew has definite but no indefinite article', 'a/an is new'], tags: ['articles', 'grammar'], unlocksAfter: 'G-01' },
  { id: 'G-08', type: 'grammar', title: 'Prepositions of time', level: 'A2', order: 8, assetPath: 'lessons/G-08-prepositions-time.json', hebrewFocus: ['in/on/at map poorly to Hebrew'], tags: ['prepositions', 'time'], unlocksAfter: 'G-01' },
  { id: 'G-09', type: 'grammar', title: 'Prepositions of place', level: 'A2', order: 9, assetPath: 'lessons/G-09-prepositions-place.json', hebrewFocus: ['in/on/at location differ from Hebrew'], tags: ['prepositions', 'place'], unlocksAfter: 'G-08' },
  { id: 'G-10', type: 'grammar', title: "Modal: can / can't", level: 'A2', order: 10, assetPath: 'lessons/G-10-modal-can.json', hebrewFocus: ['Hebrew yakhol differs', 'requests with can'], tags: ['modal', 'basics'], unlocksAfter: 'G-01' },
  { id: 'G-11', type: 'grammar', title: 'Modal: should / must', level: 'A2', order: 11, assetPath: 'lessons/G-11-modal-should-must.json', hebrewFocus: ['must vs should distinction absent in Hebrew'], tags: ['modal'], unlocksAfter: 'G-10' },
  { id: 'G-12', type: 'grammar', title: 'Countable & uncountable', level: 'A2', order: 12, assetPath: 'lessons/G-12-countable-uncountable.json', hebrewFocus: ['some/any/much/many — not in Hebrew this way'], tags: ['nouns', 'quantity'], unlocksAfter: 'G-01' },
  { id: 'G-13', type: 'grammar', title: 'Adjectives & adverbs', level: 'A2', order: 13, assetPath: 'lessons/G-13-adjectives-adverbs.json', hebrewFocus: ['-ly adverbs', 'adverb same form as adjective in Hebrew'], tags: ['adjectives', 'adverbs'], unlocksAfter: 'G-01' },
  { id: 'G-14', type: 'grammar', title: 'Question words', level: 'A2', order: 14, assetPath: 'lessons/G-14-question-words.json', hebrewFocus: ['do/does inversion', 'Hebrew uses intonation only'], tags: ['questions', 'basics'], unlocksAfter: 'G-01' },

  // ── B1 Grammar (12 lessons) ──────────────────────────────────────────────
  { id: 'G-15', type: 'grammar', title: 'Present perfect', level: 'B1', order: 15, assetPath: 'lessons/G-15-present-perfect.json', hebrewFocus: ['no equivalent tense in Hebrew'], tags: ['tense', 'perfect'], unlocksAfter: 'G-14' },
  { id: 'G-16', type: 'grammar', title: 'Present perfect vs past simple', level: 'B1', order: 16, assetPath: 'lessons/G-16-present-perfect-vs-past-simple.json', hebrewFocus: ['tense by time reference — unfamiliar'], tags: ['tense', 'perfect', 'past'], unlocksAfter: 'G-15' },
  { id: 'G-17', type: 'grammar', title: 'Past continuous', level: 'B1', order: 17, assetPath: 'lessons/G-17-past-continuous.json', hebrewFocus: ['Hebrew uses simple past for background actions'], tags: ['tense', 'past', 'continuous'], unlocksAfter: 'G-04' },
  { id: 'G-18', type: 'grammar', title: 'Comparatives & superlatives', level: 'B1', order: 18, assetPath: 'lessons/G-18-comparatives-superlatives.json', hebrewFocus: ['more/most pattern familiar via יותר/הכי'], tags: ['adjectives', 'comparison'], unlocksAfter: 'G-13' },
  { id: 'G-19', type: 'grammar', title: 'First conditional', level: 'B1', order: 19, assetPath: 'lessons/G-19-first-conditional.json', hebrewFocus: ['if + present → will', 'Hebrew אם differs'], tags: ['conditionals'], unlocksAfter: 'G-05' },
  { id: 'G-20', type: 'grammar', title: 'Second conditional', level: 'B1', order: 20, assetPath: 'lessons/G-20-second-conditional.json', hebrewFocus: ['hypothetical mood — rarely used in Hebrew'], tags: ['conditionals'], unlocksAfter: 'G-19' },
  { id: 'G-21', type: 'grammar', title: 'Passive voice', level: 'B1', order: 21, assetPath: 'lessons/G-21-passive-voice.json', hebrewFocus: ["Hebrew nif'al exists but used less"], tags: ['passive', 'voice'], unlocksAfter: 'G-02' },
  { id: 'G-22', type: 'grammar', title: 'Modal verbs advanced', level: 'B1', order: 22, assetPath: 'lessons/G-22-modal-verbs-advanced.json', hebrewFocus: ['could/might/may nuance', 'Hebrew uses context'], tags: ['modal', 'advanced'], unlocksAfter: 'G-11' },
  { id: 'G-23', type: 'grammar', title: 'Defining relative clauses', level: 'B1', order: 23, assetPath: 'lessons/G-23-relative-clauses.json', hebrewFocus: ['who/which/that', 'Hebrew ש used for all'], tags: ['relative clauses'], unlocksAfter: 'G-14' },
  { id: 'G-24', type: 'grammar', title: 'Gerunds & infinitives', level: 'B1', order: 24, assetPath: 'lessons/G-24-gerunds-infinitives.json', hebrewFocus: ['verb + -ing vs to', 'Hebrew infinitive covers both'], tags: ['gerunds', 'infinitives'], unlocksAfter: 'G-01' },
  { id: 'G-25', type: 'grammar', title: 'Used to / would', level: 'B1', order: 25, assetPath: 'lessons/G-25-used-to-would.json', hebrewFocus: ['past habits', 'Hebrew uses past simple'], tags: ['past', 'habits'], unlocksAfter: 'G-03' },
  { id: 'G-26', type: 'grammar', title: 'Linking words', level: 'B1', order: 26, assetPath: 'lessons/G-26-linking-words.json', hebrewFocus: ['although/however/despite', 'Hebrew connectors differ'], tags: ['linking', 'discourse'], unlocksAfter: 'G-14' },

  // ── B2 Grammar (10 lessons) ──────────────────────────────────────────────
  { id: 'G-27', type: 'grammar', title: 'Third conditional', level: 'B2', order: 27, assetPath: 'lessons/G-27-third-conditional.json', hebrewFocus: ['would have', 'no direct Hebrew equivalent'], tags: ['conditionals', 'advanced'], unlocksAfter: 'G-20' },
  { id: 'G-28', type: 'grammar', title: 'Mixed conditionals', level: 'B2', order: 28, assetPath: 'lessons/G-28-mixed-conditionals.json', hebrewFocus: ['combining past and present hypotheticals'], tags: ['conditionals', 'advanced'], unlocksAfter: 'G-27' },
  { id: 'G-29', type: 'grammar', title: 'Reported speech', level: 'B2', order: 29, assetPath: 'lessons/G-29-reported-speech.json', hebrewFocus: ['tense backshift', 'Hebrew stays in original tense'], tags: ['reported speech'], unlocksAfter: 'G-16' },
  { id: 'G-30', type: 'grammar', title: 'Wish / if only', level: 'B2', order: 30, assetPath: 'lessons/G-30-wish-if-only.json', hebrewFocus: ['expressing regret', 'Hebrew אילו differs'], tags: ['wish', 'regret'], unlocksAfter: 'G-20' },
  { id: 'G-31', type: 'grammar', title: 'Non-defining relative clauses', level: 'B2', order: 31, assetPath: 'lessons/G-31-non-defining-relative-clauses.json', hebrewFocus: ['commas + extra info', "Hebrew ש doesn't work this way"], tags: ['relative clauses', 'advanced'], unlocksAfter: 'G-23' },
  { id: 'G-32', type: 'grammar', title: 'Advanced passives', level: 'B2', order: 32, assetPath: 'lessons/G-32-advanced-passives.json', hebrewFocus: ['perfect and modal passives', 'Hebrew passive is simpler'], tags: ['passive', 'advanced'], unlocksAfter: 'G-21' },
  { id: 'G-33', type: 'grammar', title: 'Inversion & emphasis', level: 'B2', order: 33, assetPath: 'lessons/G-33-inversion-emphasis.json', hebrewFocus: ['fronting for emphasis', 'Hebrew word order flexible'], tags: ['inversion', 'emphasis'], unlocksAfter: 'G-26' },
  { id: 'G-34', type: 'grammar', title: 'Noun clauses', level: 'B2', order: 34, assetPath: 'lessons/G-34-noun-clauses.json', hebrewFocus: ['nominalised clauses less common in Hebrew'], tags: ['noun clauses'], unlocksAfter: 'G-23' },
  { id: 'G-35', type: 'grammar', title: 'Discourse markers', level: 'B2', order: 35, assetPath: 'lessons/G-35-discourse-markers.json', hebrewFocus: ['moreover/nevertheless', 'Hebrew written discourse differs'], tags: ['discourse', 'advanced'], unlocksAfter: 'G-26' },
  { id: 'G-36', type: 'grammar', title: 'Phrasal verbs in depth', level: 'B2', order: 36, assetPath: 'lessons/G-36-phrasal-verbs.json', hebrewFocus: ['no equivalent in Hebrew', 'must memorise as units'], tags: ['phrasal verbs', 'advanced'], unlocksAfter: 'G-26' },

  // ── Vocabulary (18 sets) ─────────────────────────────────────────────────
  { id: 'V-01', type: 'vocabulary', title: 'Daily life & routines', level: 'A2', order: 37, assetPath: 'vocabulary/V-01-daily-life.json', hebrewFocus: ['daily verbs', 'time expressions'], tags: ['daily', 'routines'], unlocksAfter: null },
  { id: 'V-02', type: 'vocabulary', title: 'Food & eating', level: 'A2', order: 38, assetPath: 'vocabulary/V-02-food-eating.json', hebrewFocus: ['cooking verbs', 'meal vocabulary'], tags: ['food', 'cooking'], unlocksAfter: 'V-01' },
  { id: 'V-03', type: 'vocabulary', title: 'People & relationships', level: 'A2', order: 39, assetPath: 'vocabulary/V-03-people-relationships.json', hebrewFocus: ['family', 'personality adjectives'], tags: ['people', 'relationships'], unlocksAfter: 'V-01' },
  { id: 'V-04', type: 'vocabulary', title: 'Places & travel', level: 'A2', order: 40, assetPath: 'vocabulary/V-04-places-travel.json', hebrewFocus: ['transport', 'directions'], tags: ['travel', 'places'], unlocksAfter: 'V-01' },
  { id: 'V-05', type: 'vocabulary', title: 'Health & body', level: 'A2', order: 41, assetPath: 'vocabulary/V-05-health-body.json', hebrewFocus: ['symptoms', 'doctor visits'], tags: ['health', 'body'], unlocksAfter: 'V-01' },
  { id: 'V-06', type: 'vocabulary', title: 'Shopping & money', level: 'A2', order: 42, assetPath: 'vocabulary/V-06-shopping-money.json', hebrewFocus: ['prices', 'transactions'], tags: ['shopping', 'money'], unlocksAfter: 'V-01' },
  { id: 'V-07', type: 'vocabulary', title: 'Work & career', level: 'B1', order: 43, assetPath: 'vocabulary/V-07-work-career.json', hebrewFocus: ['job roles', 'workplace actions'], tags: ['work', 'career'], unlocksAfter: 'V-06' },
  { id: 'V-08', type: 'vocabulary', title: 'Technology & internet', level: 'B1', order: 44, assetPath: 'vocabulary/V-08-technology.json', hebrewFocus: ['devices', 'online actions'], tags: ['technology', 'internet'], unlocksAfter: 'V-06' },
  { id: 'V-09', type: 'vocabulary', title: 'Emotions & feelings', level: 'B1', order: 45, assetPath: 'vocabulary/V-09-emotions.json', hebrewFocus: ['nuanced feeling words', 'reactions'], tags: ['emotions', 'feelings'], unlocksAfter: 'V-03' },
  { id: 'V-10', type: 'vocabulary', title: 'Education & studying', level: 'B1', order: 46, assetPath: 'vocabulary/V-10-education.json', hebrewFocus: ['academic vocabulary', 'study habits'], tags: ['education'], unlocksAfter: 'V-06' },
  { id: 'V-11', type: 'vocabulary', title: 'Environment & nature', level: 'B1', order: 47, assetPath: 'vocabulary/V-11-environment.json', hebrewFocus: ['climate', 'environmental issues'], tags: ['environment', 'nature'], unlocksAfter: 'V-06' },
  { id: 'V-12', type: 'vocabulary', title: 'News & media', level: 'B1', order: 48, assetPath: 'vocabulary/V-12-news-media.json', hebrewFocus: ['journalism', 'opinion'], tags: ['news', 'media'], unlocksAfter: 'V-06' },
  { id: 'V-13', type: 'vocabulary', title: 'Business & economy', level: 'B2', order: 49, assetPath: 'vocabulary/V-13-business.json', hebrewFocus: ['finance', 'negotiation'], tags: ['business', 'economy'], unlocksAfter: 'V-12' },
  { id: 'V-14', type: 'vocabulary', title: 'Idioms & fixed phrases', level: 'B2', order: 50, assetPath: 'vocabulary/V-14-idioms.json', hebrewFocus: ['common idioms', 'collocations'], tags: ['idioms', 'fixed phrases'], unlocksAfter: 'V-12' },
  { id: 'V-15', type: 'vocabulary', title: 'Abstract concepts', level: 'B2', order: 51, assetPath: 'vocabulary/V-15-abstract-concepts.json', hebrewFocus: ['philosophy', 'ethical vocabulary'], tags: ['abstract', 'concepts'], unlocksAfter: 'V-12' },
  { id: 'V-16', type: 'vocabulary', title: 'Academic writing', level: 'B2', order: 52, assetPath: 'vocabulary/V-16-academic-writing.json', hebrewFocus: ['argue', 'hedging language'], tags: ['academic', 'writing'], unlocksAfter: 'V-12' },
  { id: 'V-17', type: 'vocabulary', title: 'Sport & leisure', level: 'B2', order: 53, assetPath: 'vocabulary/V-17-sport-leisure.json', hebrewFocus: ['competition', 'sports idioms'], tags: ['sport', 'leisure'], unlocksAfter: 'V-12' },
  { id: 'V-18', type: 'vocabulary', title: 'Formal vs. informal register', level: 'B2', order: 54, assetPath: 'vocabulary/V-18-formal-informal.json', hebrewFocus: ['synonyms at different registers', 'tone-switching'], tags: ['register', 'formal', 'informal'], unlocksAfter: 'V-12' },
];
