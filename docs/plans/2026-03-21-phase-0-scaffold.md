# Phase 0 — Setup & Scaffold Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold a working Angular 20 + Tailwind CSS project with the correct folder structure, Vercel serverless routing, and the full SYLLABUS constant — ready for Phase 1 content services.

**Architecture:** Angular 20 standalone components (no NgModules), Tailwind CSS v3 utility classes, Node.js serverless functions in `/api/`, and all 54 lesson/vocab definitions in a typed TypeScript SYLLABUS constant. Lesson content lives in `/src/assets/` as static JSON, never in component code.

**Tech Stack:** Angular 20 CLI, Tailwind CSS v3, TypeScript strict mode, Vercel CLI, Node.js 22

---

## Prerequisites (done once, not committed)

1. Ensure Angular CLI is installed: `ng version` — currently shows **Angular CLI 20.0.0** ✓
2. Ensure Node.js ≥ 18: `node --version` — currently shows **v22.14.0** ✓
3. Working directory for all commands: `C:\Coding\einav-english-learn`

---

### Task 1: Create the Angular 20 project

**Files:**
- Create: `C:\Coding\einav-english-learn\app\` (Angular project root)

**Step 1: Scaffold Angular project with routing and no standalone flag (already default in v20)**

Run from `C:\Coding\einav-english-learn`:
```bash
ng new app --routing=true --style=css --ssr=false --skip-git=true
```
When prompted: accept defaults.

**Step 2: Verify it builds**

```bash
cd app && ng build --configuration=development 2>&1 | tail -5
```
Expected: `Build at: ... - Hash: ... - Time: ...ms`

**Step 3: Confirm standalone default**

Open `app/src/app/app.component.ts` — confirm it has `standalone: true` in the `@Component` decorator.

---

### Task 2: Install and configure Tailwind CSS

**Files:**
- Modify: `app/src/styles.css`
- Create: `app/tailwind.config.js`

**Step 1: Install Tailwind**

From `C:\Coding\einav-english-learn\app`:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

**Step 2: Configure content paths**

Open `app/tailwind.config.js` and replace with:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 3: Add Tailwind directives to styles.css**

Open `app/src/styles.css` and replace all content with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: Verify Tailwind works**

Open `app/src/app/app.component.html`, replace all content with:
```html
<div class="min-h-screen bg-blue-50 flex items-center justify-center">
  <h1 class="text-3xl font-bold text-blue-700">English Learning App</h1>
</div>
```

Run: `ng build --configuration=development 2>&1 | tail -5`
Expected: build succeeds with no errors.

---

### Task 3: Create the folder structure

**Files to create (all empty for now):**
- `app/src/assets/lessons/.gitkeep`
- `app/src/assets/vocabulary/.gitkeep`
- `shared/` (at repo root, outside `app/`)
- `api/` (at repo root, outside `app/`)
- `api/_lib/`

**Step 1: Create directories**

From `C:\Coding\einav-english-learn`:
```bash
mkdir -p app/src/assets/lessons app/src/assets/vocabulary shared api/api/_lib
```

**Step 2: Copy content JSON files into assets**

```bash
cp resources/lessons/*.json app/src/assets/lessons/
cp resources/vocabulary/*.json app/src/assets/vocabulary/
```

**Step 3: Verify files are there**

```bash
ls app/src/assets/lessons | wc -l
```
Expected: `36`

```bash
ls app/src/assets/vocabulary | wc -l
```
Expected: `18`

---

### Task 4: Create vercel.json

**Files:**
- Create: `vercel.json` (at repo root `C:\Coding\einav-english-learn\`)

**Step 1: Write vercel.json**

Create `C:\Coding\einav-english-learn\vercel.json`:
```json
{
  "version": 2,
  "buildCommand": "cd app && ng build --configuration=production",
  "outputDirectory": "app/dist/app/browser",
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

---

### Task 5: Create .env.local and .gitignore

**Files:**
- Create: `.env.local` (repo root)
- Modify: `.gitignore` (repo root, create if absent)

**Step 1: Create .gitignore**

Create `C:\Coding\einav-english-learn\.gitignore`:
```
.env.local
.env*.local
node_modules/
app/dist/
app/.angular/
*.js.map
```

**Step 2: Create .env.local template**

Create `C:\Coding\einav-english-learn\.env.local`:
```
# Supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI
GROQ_API_KEY=your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here

# Auth
JWT_SECRET=your_supabase_jwt_secret_here
```

---

### Task 6: Create the Zod schemas

**Files:**
- Create: `shared/lesson.schema.ts`
- Create: `shared/vocabulary.schema.ts`

**Step 1: Install Zod in the app**

From `C:\Coding\einav-english-learn\app`:
```bash
npm install zod
```

**Step 2: Create lesson.schema.ts**

Create `C:\Coding\einav-english-learn\shared\lesson.schema.ts`:
```typescript
import { z } from 'zod';

const GoodExampleSchema = z.object({
  id: z.string(),
  sentence: z.string(),
  audio_text: z.string(),
  note: z.string().optional(),
});

const BadExampleSchema = z.object({
  id: z.string(),
  wrong: z.string(),
  correct: z.string(),
  reason: z.string(),
});

const ExerciseSchema = z.object({
  id: z.string(),
  type: z.enum(['fill_blank', 'mcq', 'error_correction', 'sentence_builder']),
  question: z.string().max(500),
  answer: z.string().max(300),
  hint: z.string().max(200),
  explanation: z.string().max(400),
  hebrew_note: z.string().optional(),
  distractors: z.array(z.string()).length(3).optional(),
  words: z.array(z.string()).min(4).max(8).optional(),
});

const SpeakSentenceSchema = z.object({
  id: z.string(),
  sentence: z.string(),
  chunks: z.array(z.string()),
  phonetic_hints: z.string(),
  pass_threshold: z.number().min(0.5).max(1.0),
});

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  level: z.enum(['A2', 'B1', 'B2']),
  order: z.number().optional(),
  explain: z.object({
    rule: z.string().max(400),
    why_matters: z.string(),
    hebrew_note: z.string(),
    tip: z.string(),
    form: z.record(z.string()).optional(),
    spelling_rules: z.array(z.object({ rule: z.string(), examples: z.array(z.string()) })).optional(),
    frequency_adverbs: z.array(z.object({ word: z.string(), meaning: z.string(), example: z.string() })).optional(),
    good_examples: z.array(GoodExampleSchema).min(3),
    bad_examples: z.array(BadExampleSchema).min(3),
  }),
  exercises: z.array(ExerciseSchema).min(20),
  speak: z.array(SpeakSentenceSchema).min(5),
});

export type Lesson = z.infer<typeof LessonSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type SpeakSentence = z.infer<typeof SpeakSentenceSchema>;
```

**Step 3: Create vocabulary.schema.ts**

Create `C:\Coding\einav-english-learn\shared\vocabulary.schema.ts`:
```typescript
import { z } from 'zod';

const WordEntrySchema = z.object({
  id: z.string(),
  word: z.string(),
  part_of_speech: z.enum(['noun', 'verb', 'adjective', 'adverb', 'phrase']),
  definition: z.string(),
  example_sentences: z.array(z.string()).length(3),
  pronunciation_tip: z.string(),
  common_mistake: z.string(),
  collocations: z.array(z.string()).min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export const VocabSetSchema = z.object({
  id: z.string(),
  theme: z.string(),
  level: z.enum(['A2', 'B1', 'B2']),
  words: z.array(WordEntrySchema).min(15),
});

export type VocabSet = z.infer<typeof VocabSetSchema>;
export type WordEntry = z.infer<typeof WordEntrySchema>;
```

**Step 4: Validate all existing JSON files against schemas**

Create `C:\Coding\einav-english-learn\scripts\validate-content.mjs`:
```javascript
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Inline schemas to avoid TS compilation step
const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  level: z.enum(['A2', 'B1', 'B2']),
  exercises: z.array(z.object({ id: z.string(), type: z.string() })).min(20),
  speak: z.array(z.object({ id: z.string() })).min(5),
  explain: z.object({ rule: z.string(), good_examples: z.array(z.object({})).min(3) }),
});

const VocabSchema = z.object({
  id: z.string(),
  theme: z.string(),
  level: z.enum(['A2', 'B1', 'B2']),
  words: z.array(z.object({ id: z.string(), word: z.string() })).min(15),
});

let errors = 0;

for (const f of readdirSync('app/src/assets/lessons')) {
  const data = JSON.parse(readFileSync(join('app/src/assets/lessons', f), 'utf8'));
  const r = LessonSchema.safeParse(data);
  if (!r.success) { console.error(`FAIL ${f}:`, r.error.issues[0]); errors++; }
  else console.log(`OK   ${f}`);
}

for (const f of readdirSync('app/src/assets/vocabulary')) {
  const data = JSON.parse(readFileSync(join('app/src/assets/vocabulary', f), 'utf8'));
  const r = VocabSchema.safeParse(data);
  if (!r.success) { console.error(`FAIL ${f}:`, r.error.issues[0]); errors++; }
  else console.log(`OK   ${f}`);
}

console.log(`\n${errors === 0 ? '✓ All files valid' : `✗ ${errors} file(s) failed'`}`);
process.exit(errors > 0 ? 1 : 0);
```

Run from `C:\Coding\einav-english-learn`:
```bash
cd app && npm install zod && cd .. && node --input-type=module < scripts/validate-content.mjs
```
Expected: all 54 files print `OK`.

---

### Task 7: Create the SYLLABUS constant

**Files:**
- Create: `shared/syllabus.constants.ts`

**Step 1: Write the full SYLLABUS constant**

Create `C:\Coding\einav-english-learn\shared\syllabus.constants.ts`:
```typescript
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
  { id: 'G-10', type: 'grammar', title: 'Modal: can / can\'t', level: 'A2', order: 10, assetPath: 'lessons/G-10-modal-can.json', hebrewFocus: ['Hebrew yakhol differs', 'requests with can'], tags: ['modal', 'basics'], unlocksAfter: 'G-01' },
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
  { id: 'G-21', type: 'grammar', title: 'Passive voice', level: 'B1', order: 21, assetPath: 'lessons/G-21-passive-voice.json', hebrewFocus: ['Hebrew nif\'al exists but used less'], tags: ['passive', 'voice'], unlocksAfter: 'G-02' },
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
  { id: 'G-31', type: 'grammar', title: 'Non-defining relative clauses', level: 'B2', order: 31, assetPath: 'lessons/G-31-non-defining-relative-clauses.json', hebrewFocus: ['commas + extra info', 'Hebrew ש doesn\'t work this way'], tags: ['relative clauses', 'advanced'], unlocksAfter: 'G-23' },
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
```

**Step 2: Verify it compiles**

From `C:\Coding\einav-english-learn`:
```bash
npx tsc --noEmit --strict --moduleResolution node --target ES2022 --module CommonJS shared/syllabus.constants.ts
```
Expected: no output (no errors).

---

### Task 8: Initialize git and make the first commit

**Step 1: Initialize git repo**

From `C:\Coding\einav-english-learn`:
```bash
git init
git add .gitignore
git commit -m "chore: add .gitignore"
```

**Step 2: Stage and commit the scaffold**

```bash
git add app/ shared/ api/ vercel.json docs/ scripts/
git commit -m "feat: scaffold Angular 20 + Tailwind + SYLLABUS constant (Phase 0)"
```

Expected: commit succeeds.

---

## Phase 0 Done — Verify Checklist

- [ ] `app/` directory contains a working Angular 20 project
- [ ] `ng build --configuration=development` succeeds
- [ ] Tailwind classes render (blue heading visible with `ng serve`)
- [ ] `app/src/assets/lessons/` contains 36 JSON files
- [ ] `app/src/assets/vocabulary/` contains 18 JSON files
- [ ] `shared/syllabus.constants.ts` compiles with no TypeScript errors
- [ ] `shared/lesson.schema.ts` and `shared/vocabulary.schema.ts` exist
- [ ] `vercel.json` exists at repo root
- [ ] `.env.local` exists and is in `.gitignore`
- [ ] All JSON files pass validation script
- [ ] Git repo initialized with first commit

**Next step: Phase 1 — Content Pipeline (lesson service, vocab service, HttpClient loading)**
