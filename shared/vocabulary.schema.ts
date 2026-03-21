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
