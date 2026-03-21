import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

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

console.log(`\n${errors === 0 ? '✓ All files valid' : `✗ ${errors} file(s) failed`}`);
process.exit(errors > 0 ? 1 : 0);
