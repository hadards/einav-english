# DB Progress Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire Supabase `lesson_progress` table to the Angular app so lesson scores are saved and displayed in the dashboard and progress page.

**Architecture:** A single `ProgressService` wraps all Supabase queries. It exposes a signal-based cache so components read progress reactively. The lesson player saves scores on completion. Dashboard and Progress page consume the service instead of hardcoded stubs.

**Tech Stack:** Angular 20 signals, @supabase/supabase-js v2, Tailwind CSS

---

### Task 1: Create ProgressService

**Files:**
- Create: `app/src/app/core/services/progress.service.ts`

**Step 1: Create the file**

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface LessonProgressRow {
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  exercise_score: number | null;
  speak_score: number | null;
  attempts: number;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private auth = inject(AuthService);

  private readonly supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      auth: {
        storage: localStorage,
        storageKey: 'sb-auth-token',
        flowType: 'pkce',
        lock: (_name: string, _timeout: number, fn: () => Promise<unknown>) => fn(),
      },
    },
  );

  // Map of lesson_id → row, null means not yet loaded
  readonly progressMap = signal<Map<string, LessonProgressRow>>(new Map());
  readonly loaded = signal(false);

  /** Load all progress rows for the current user. Call once after login. */
  async loadAll(): Promise<void> {
    const user = this.auth.currentUser$();
    if (!user) return;

    const { data, error } = await this.supabase
      .from('lesson_progress')
      .select('lesson_id, status, exercise_score, speak_score, attempts, updated_at')
      .eq('user_id', user.id);

    if (error) { console.error('[ProgressService] loadAll:', error.message); return; }

    const map = new Map<string, LessonProgressRow>();
    for (const row of data ?? []) map.set(row.lesson_id, row);
    this.progressMap.set(map);
    this.loaded.set(true);
  }

  getLesson(lessonId: string): LessonProgressRow | null {
    return this.progressMap().get(lessonId) ?? null;
  }

  /** Upsert progress for a lesson. */
  async saveLesson(
    lessonId: string,
    fields: Partial<Omit<LessonProgressRow, 'lesson_id' | 'updated_at'>>,
  ): Promise<void> {
    const user = this.auth.currentUser$();
    if (!user) return;

    const existing = this.getLesson(lessonId);
    const row = {
      user_id: user.id,
      lesson_id: lessonId,
      status: fields.status ?? existing?.status ?? 'in_progress',
      exercise_score: fields.exercise_score ?? existing?.exercise_score ?? null,
      speak_score: fields.speak_score ?? existing?.speak_score ?? null,
      attempts: (existing?.attempts ?? 0) + 1,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.supabase
      .from('lesson_progress')
      .upsert(row, { onConflict: 'user_id,lesson_id' });

    if (error) { console.error('[ProgressService] saveLesson:', error.message); return; }

    // Update local cache immediately
    const next = new Map(this.progressMap());
    next.set(lessonId, {
      lesson_id: lessonId,
      status: row.status,
      exercise_score: row.exercise_score,
      speak_score: row.speak_score,
      attempts: row.attempts,
      updated_at: row.updated_at,
    });
    this.progressMap.set(next);
  }
}
```

**Step 2: Verify build passes**
```bash
cd app && npm run build
```
Expected: no errors

**Step 3: Commit**
```bash
git add app/src/app/core/services/progress.service.ts
git commit -m "feat: add ProgressService with Supabase lesson_progress upsert + signal cache"
```

---

### Task 2: Load progress on login (AppComponent)

**Files:**
- Modify: `app/src/app/app.ts`

**Step 1: Read current app.ts**

Read the file first, then add an effect that calls `progressService.loadAll()` when the user becomes logged in.

**Step 2: Inject ProgressService and load on auth**

In the AppComponent constructor add:
```typescript
import { effect, inject } from '@angular/core';
import { ProgressService } from './core/services/progress.service';
import { AuthService } from './core/services/auth.service';

// in constructor:
const auth = inject(AuthService);
const progress = inject(ProgressService);
effect(() => {
  if (auth.isLoggedIn$()) {
    progress.loadAll();
  }
});
```

**Step 3: Verify build**
```bash
cd app && npm run build
```

**Step 4: Commit**
```bash
git add app/src/app/app.ts
git commit -m "feat: load user progress from Supabase on login"
```

---

### Task 3: Save exercise score from lesson player

**Files:**
- Modify: `app/src/app/features/lesson/lesson-player.component.ts`

**Step 1: Read lesson-player.component.ts**

**Step 2: Inject ProgressService and save on practice complete**

```typescript
import { ProgressService } from '../../core/services/progress.service';

// inject:
private progress = inject(ProgressService);

// in onPracticeComplete(score: number):
onPracticeComplete(score: number) {
  this.practiceScore.set(score);
  const id = this.lesson()?.id;
  if (id) {
    this.progress.saveLesson(id, {
      exercise_score: score,
      status: score >= 0.7 ? 'in_progress' : 'in_progress',
    });
  }
}

// in onSpeakComplete(score: number):
onSpeakComplete(score: number) {
  this.speakScore.set(score);
  const id = this.lesson()?.id;
  if (id) {
    this.progress.saveLesson(id, {
      speak_score: score,
      status: 'completed',
    });
  }
}
```

**Step 3: Verify build**
```bash
cd app && npm run build
```

**Step 4: Commit**
```bash
git add app/src/app/features/lesson/lesson-player.component.ts
git commit -m "feat: save exercise and speak scores to Supabase on lesson completion"
```

---

### Task 4: Wire dashboard to real progress

**Files:**
- Modify: `app/src/app/features/dashboard/dashboard.component.ts`

**Step 1: Read dashboard.component.ts fully**

**Step 2: Replace hardcoded status with ProgressService**

Replace the `allCards` computed that hardcodes `status: 'not_started'`:

```typescript
import { ProgressService } from '../../core/services/progress.service';

// inject:
private progress = inject(ProgressService);

// replace allCards computed:
private readonly allCards = computed<LessonCard[]>(() =>
  this.syllabus.getAll().map(e => {
    const row = this.progress.getLesson(e.id);
    return {
      ...e,
      status: (row?.status ?? 'not_started') as LessonStatus,
      score: row?.exercise_score ?? undefined,
    };
  })
);
```

**Step 3: Verify build**
```bash
cd app && npm run build
```

**Step 4: Commit**
```bash
git add app/src/app/features/dashboard/dashboard.component.ts
git commit -m "feat: dashboard reads real lesson progress from ProgressService"
```

---

### Task 5: Wire progress page to real progress

**Files:**
- Modify: `app/src/app/features/progress/progress.component.ts`

**Step 1: Read progress.component.ts fully**

**Step 2: Replace hardcoded status with ProgressService**

Inject `ProgressService` and replace the static `allLessons` / status mapping:

```typescript
import { ProgressService } from '../../core/services/progress.service';

// inject:
private progress = inject(ProgressService);

// replace allLessons computed:
private readonly allLessons = computed<LessonProgress[]>(() =>
  this.syllabus.getAll().map(e => {
    const row = this.progress.getLesson(e.id);
    return {
      id: e.id,
      title: e.title,
      level: e.level,
      type: e.type,
      status: (row?.status ?? 'not_started') as LessonStatus,
      score: row?.exercise_score ?? 0,
    };
  })
);
```

**Step 3: Verify build**
```bash
cd app && npm run build
```

**Step 4: Commit**
```bash
git add app/src/app/features/progress/progress.component.ts
git commit -m "feat: progress page reads real data from ProgressService"
```

---

### Task 6: Mark lesson as in_progress when opened

**Files:**
- Modify: `app/src/app/features/lesson/lesson-player.component.ts`

**Step 1: In `ngOnInit`, after lesson loads successfully, save in_progress status only if not already completed**

```typescript
this.lessonSvc.getLesson(id).subscribe({
  next: lesson => {
    this.lesson.set(lesson);
    this.loading.set(false);
    // mark as in_progress if not already completed
    const existing = this.progress.getLesson(lesson.id);
    if (!existing || existing.status === 'not_started') {
      this.progress.saveLesson(lesson.id, { status: 'in_progress' });
    }
  },
  ...
});
```

**Step 2: Verify build**
```bash
cd app && npm run build
```

**Step 3: Commit**
```bash
git add app/src/app/features/lesson/lesson-player.component.ts
git commit -m "feat: mark lesson in_progress when first opened"
```

---

### Task 7: Show score badge on dashboard cards

**Files:**
- Modify: `app/src/app/features/dashboard/dashboard.component.ts`

**Step 1: In the lesson card template, add a score badge when status is completed or in_progress**

Find the status display section inside the card and add after the status span:
```html
@if (card.score !== undefined) {
  <span class="ml-auto text-xs font-bold" style="color:#6366f1">
    {{ (card.score * 100).toFixed(0) }}%
  </span>
}
```

**Step 2: Verify build**
```bash
cd app && npm run build
```

**Step 3: Commit**
```bash
git add app/src/app/features/dashboard/dashboard.component.ts
git commit -m "feat: show exercise score badge on completed dashboard cards"
```
