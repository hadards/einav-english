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
    form: z.record(z.string(), z.string()).optional(),
    spelling_rules: z.array(z.object({ rule: z.string(), examples: z.string() })).optional(),
    frequency_adverbs: z.object({
      note: z.string(),
      list: z.array(z.object({ word: z.string(), meaning: z.string(), example: z.string() })),
    }).optional(),
    good_examples: z.array(GoodExampleSchema).min(3),
    bad_examples: z.array(BadExampleSchema).min(3),
  }),
  exercises: z.array(ExerciseSchema).min(20),
  speak: z.array(SpeakSentenceSchema).min(5),
});

export type Lesson = z.infer<typeof LessonSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type SpeakSentence = z.infer<typeof SpeakSentenceSchema>;
