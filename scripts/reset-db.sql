-- ============================================================
-- reset-db.sql
-- Run in Supabase SQL editor to fully reset progress tables.
-- Safe to re-run: drops and recreates everything cleanly.
-- ============================================================

-- Drop existing tables
drop table if exists vocabulary_progress cascade;
drop table if exists lesson_progress cascade;

-- ============================================================
-- lesson_progress
-- Tracks per-user, per-lesson status and scores
-- ============================================================
create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id text not null,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  exercise_score numeric,   -- 0.0 – 1.0
  speak_score numeric,      -- 0.0 – 1.0
  attempts int not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

alter table lesson_progress enable row level security;

create policy "users own their lesson progress"
  on lesson_progress for all
  using (auth.uid() = user_id);

-- ============================================================
-- vocabulary_progress
-- Tracks per-user, per-word mastery for spaced repetition
-- ============================================================
create table vocabulary_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  word_id text not null,
  mastery_level int not null default 0
    check (mastery_level between 0 and 3),
  next_review_at timestamptz not null default now(),
  review_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, word_id)
);

alter table vocabulary_progress enable row level security;

create policy "users own their vocab progress"
  on vocabulary_progress for all
  using (auth.uid() = user_id);

-- ============================================================
-- Indexes for fast user lookups
-- ============================================================
create index idx_lesson_progress_user on lesson_progress(user_id);
create index idx_vocab_progress_user on vocabulary_progress(user_id);
