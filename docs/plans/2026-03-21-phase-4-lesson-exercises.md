# Phase 4 — Lesson Exercises Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the full lesson player: Explain tab (rule, examples, Hebrew notes), Practice tab (all 4 exercise types with scoring), and wire the `/lesson/:id` route to load real JSON.

**Architecture:** `LessonPlayerComponent` at `/lesson/:id` orchestrates three sequential tabs: Explain → Practice → Speak (Speak is Phase 5). It uses `LessonService` to load the lesson JSON. The Practice tab shuffles exercises, tracks score live, shows hint/explanation on wrong answers, and re-queues wrong answers once. Progress is saved to Supabase API on completion (stub for now — Phase 4 saves locally; Phase 5 adds the API call). Each exercise type is a separate child component.

**Tech Stack:** Angular 20 standalone, signals, `LessonService`, Tailwind CSS, Angular Router `ActivatedRoute`.

---

### Task 1: Create LessonPlayerComponent skeleton + route

**Files:**
- Create: `app/src/app/features/lesson/lesson-player.component.ts`
- Modify: `app/src/app/app.routes.ts`

**Step 1: Create lesson feature directory**
```bash
mkdir -p app/src/app/features/lesson
```

**Step 2: Create LessonPlayerComponent**

Create `C:\Coding\einav-english-learn\app\src\app\features\lesson\lesson-player.component.ts`:
```typescript
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LessonService } from '../../core/services/lesson.service';
import type { Lesson } from '@shared/lesson.schema';

type Tab = 'explain' | 'practice' | 'speak';

@Component({
  selector: 'app-lesson-player',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Back nav -->
      <div class="bg-white border-b border-gray-200 px-4 py-3">
        <a routerLink="/dashboard" class="text-blue-600 text-sm flex items-center gap-1">
          ← Dashboard
        </a>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center h-64 text-gray-400">Loading lesson...</div>
      } @else if (error()) {
        <div class="flex items-center justify-center h-64 text-red-500">{{ error() }}</div>
      } @else if (lesson()) {
        <!-- Lesson header -->
        <div class="bg-white px-4 py-4 border-b border-gray-100">
          <div class="max-w-2xl mx-auto">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-mono text-gray-400">{{ lesson()!.id }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">{{ lesson()!.level }}</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900">{{ lesson()!.title }}</h1>
          </div>
        </div>

        <!-- Tab bar -->
        <div class="bg-white border-b border-gray-200">
          <div class="max-w-2xl mx-auto flex">
            <button (click)="activeTab.set('explain')" [class]="tabClass('explain')" class="flex-1 py-3 text-sm font-medium transition border-b-2">Explain</button>
            <button (click)="activeTab.set('practice')" [class]="tabClass('practice')" class="flex-1 py-3 text-sm font-medium transition border-b-2">Practice</button>
            <button [disabled]="!practiceUnlocked()" (click)="practiceUnlocked() && activeTab.set('speak')" [class]="tabClass('speak')" class="flex-1 py-3 text-sm font-medium transition border-b-2 disabled:opacity-40">Speak</button>
          </div>
        </div>

        <!-- Tab content -->
        <div class="max-w-2xl mx-auto px-4 py-6">
          @if (activeTab() === 'explain') {
            <app-explain-tab [lesson]="lesson()!" (startPractice)="activeTab.set('practice')" />
          } @else if (activeTab() === 'practice') {
            <app-practice-tab [lesson]="lesson()!" (completed)="onPracticeComplete($event)" />
          } @else {
            <div class="text-center text-gray-500 py-12">
              <p class="text-lg font-medium mb-2">Speaking practice</p>
              <p class="text-sm">Coming in Phase 5</p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class LessonPlayerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private lessonSvc = inject(LessonService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly lesson = signal<Lesson | null>(null);
  readonly activeTab = signal<Tab>('explain');
  readonly practiceUnlocked = signal(false);
  readonly practiceScore = signal<number | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/dashboard']); return; }

    this.lessonSvc.getLesson(id).subscribe({
      next: lesson => { this.lesson.set(lesson); this.loading.set(false); },
      error: err => { this.error.set('Could not load lesson.'); this.loading.set(false); },
    });
  }

  tabClass(tab: Tab): string {
    return tab === this.activeTab()
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700';
  }

  onPracticeComplete(score: number) {
    this.practiceScore.set(score);
    if (score >= 0.7) {
      this.practiceUnlocked.set(true);
    }
    // Phase 8 will save progress to Supabase here
  }
}
```

Note: `<app-explain-tab>` and `<app-practice-tab>` will be created in Tasks 2 and 3 — the build will fail until they exist.

**Step 3: Update app.routes.ts to use LessonPlayerComponent**

Read current `app/src/app/app.routes.ts` and replace the stub `/lesson/:id` route:
```typescript
{
  path: 'lesson/:id',
  loadComponent: () => import('./features/lesson/lesson-player.component').then(m => m.LessonPlayerComponent),
  canActivate: [authGuard],
},
```

---

### Task 2: Create ExplainTabComponent

**Files:**
- Create: `app/src/app/features/lesson/explain-tab.component.ts`

Create `C:\Coding\einav-english-learn\app\src\app\features\lesson\explain-tab.component.ts`:
```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Lesson } from '@shared/lesson.schema';

@Component({
  selector: 'app-explain-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-6">

      <!-- Rule card -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">The Rule</h2>
        <p class="text-gray-800 leading-relaxed">{{ lesson.explain.rule }}</p>
      </div>

      <!-- Hebrew note -->
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h2 class="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">💡 Hebrew speakers note</h2>
        <p class="text-amber-900 text-sm leading-relaxed">{{ lesson.explain.hebrew_note }}</p>
      </div>

      <!-- Tip -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h2 class="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Tip</h2>
        <p class="text-blue-900 text-sm">{{ lesson.explain.tip }}</p>
      </div>

      <!-- Good examples -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">✓ Good examples</h2>
        <ul class="flex flex-col gap-3">
          @for (ex of lesson.explain.good_examples; track ex.id) {
            <li class="text-sm text-gray-800 bg-green-50 rounded-lg px-3 py-2 border border-green-100">
              {{ ex.sentence }}
            </li>
          }
        </ul>
      </div>

      <!-- Bad examples -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">✗ Common mistakes</h2>
        <ul class="flex flex-col gap-3">
          @for (ex of lesson.explain.bad_examples; track ex.id) {
            <li class="text-sm bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              <span class="line-through text-red-500">{{ ex.wrong }}</span>
              <span class="text-gray-400 mx-2">→</span>
              <span class="text-green-700 font-medium">{{ ex.correct }}</span>
              <p class="text-gray-500 text-xs mt-1">{{ ex.reason }}</p>
            </li>
          }
        </ul>
      </div>

      <!-- Start practice button -->
      <button
        (click)="startPractice.emit()"
        class="w-full bg-blue-600 text-white rounded-xl py-4 font-semibold text-base hover:bg-blue-700 transition min-h-[44px]"
      >
        Start practising →
      </button>
    </div>
  `,
})
export class ExplainTabComponent {
  @Input({ required: true }) lesson!: Lesson;
  @Output() startPractice = new EventEmitter<void>();
}
```

Update `lesson-player.component.ts` imports to include `ExplainTabComponent`:
```typescript
import { ExplainTabComponent } from './explain-tab.component';
// add to imports: [CommonModule, RouterLink, ExplainTabComponent]
```

---

### Task 3: Create PracticeTabComponent with all 4 exercise types

**Files:**
- Create: `app/src/app/features/lesson/practice-tab.component.ts`

Create `C:\Coding\einav-english-learn\app\src\app\features\lesson\practice-tab.component.ts`:
```typescript
import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Lesson, Exercise } from '@shared/lesson.schema';

type AnswerState = 'unanswered' | 'correct' | 'wrong_once' | 'wrong_twice';

interface ExerciseState {
  exercise: Exercise;
  state: AnswerState;
  userAnswer: string;
  showHint: boolean;
  showExplanation: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

@Component({
  selector: 'app-practice-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col gap-6">

      <!-- Progress bar -->
      <div>
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>{{ answeredCount() }} / {{ queue().length }} answered</span>
          <span class="font-medium text-blue-600">Score: {{ scoreDisplay() }}</span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-blue-500 rounded-full transition-all" [style.width]="progressPct() + '%'"></div>
        </div>
      </div>

      @if (done()) {
        <!-- Completed screen -->
        <div class="text-center py-10">
          <p class="text-4xl mb-3">{{ scoreDisplay() }} {{ passMark() ? '🎉' : '💪' }}</p>
          <p class="text-lg font-semibold text-gray-800 mb-1">{{ passMark() ? 'Practice complete!' : 'Keep going!' }}</p>
          <p class="text-sm text-gray-500 mb-6">
            {{ passMark() ? 'Speak tab is now unlocked.' : 'You need 70% to unlock speaking practice.' }}
          </p>
          <button
            (click)="completed.emit(finalScore())"
            class="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition min-h-[44px]"
          >
            {{ passMark() ? 'Continue to Speak →' : 'Retry' }}
          </button>
        </div>
      } @else if (currentItem()) {
        <!-- Current exercise -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">

          <!-- Type badge -->
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">{{ currentItem()!.exercise.type }}</span>
            @if (currentItem()!.state === 'wrong_once' || currentItem()!.state === 'wrong_twice') {
              <span class="text-xs text-orange-500">Wrong — {{ currentItem()!.state === 'wrong_once' ? 'try again' : 'see explanation' }}</span>
            }
          </div>

          <!-- Question -->
          <p class="text-gray-800 font-medium leading-relaxed">{{ currentItem()!.exercise.question }}</p>

          <!-- fill_blank -->
          @if (currentItem()!.exercise.type === 'fill_blank') {
            <input
              type="text"
              [(ngModel)]="userInput"
              (keydown.enter)="submit()"
              placeholder="Type your answer..."
              class="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]"
              style="font-size: 16px"
            />
          }

          <!-- mcq -->
          @if (currentItem()!.exercise.type === 'mcq') {
            <div class="flex flex-col gap-2">
              @for (opt of mcqOptions(); track opt) {
                <button
                  (click)="selectMcq(opt)"
                  [class]="mcqClass(opt)"
                  class="w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition min-h-[44px]"
                >{{ opt }}</button>
              }
            </div>
          }

          <!-- error_correction -->
          @if (currentItem()!.exercise.type === 'error_correction') {
            <textarea
              [(ngModel)]="userInput"
              rows="3"
              placeholder="Fix the sentence..."
              class="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              style="font-size: 16px"
            ></textarea>
          }

          <!-- sentence_builder -->
          @if (currentItem()!.exercise.type === 'sentence_builder') {
            <div class="flex flex-col gap-3">
              <!-- Built sentence -->
              <div class="min-h-[48px] bg-gray-50 border border-dashed border-gray-300 rounded-lg px-3 py-2 flex flex-wrap gap-2">
                @for (word of builtSentence(); track $index) {
                  <button
                    (click)="removeWord($index)"
                    class="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition"
                  >{{ word }} ×</button>
                }
              </div>
              <!-- Word chips -->
              <div class="flex flex-wrap gap-2">
                @for (word of remainingWords(); track $index) {
                  <button
                    (click)="addWord(word, $index)"
                    class="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm hover:border-blue-400 transition min-h-[36px]"
                  >{{ word }}</button>
                }
              </div>
            </div>
          }

          <!-- Hint / Explanation -->
          @if (currentItem()!.showHint) {
            <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              💡 Hint: {{ currentItem()!.exercise.hint }}
            </div>
          }
          @if (currentItem()!.showExplanation) {
            <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
              {{ currentItem()!.exercise.explanation }}
              @if (currentItem()!.exercise.hebrew_note) {
                <p class="mt-2 text-amber-700">🇮🇱 {{ currentItem()!.exercise.hebrew_note }}</p>
              }
            </div>
          }

          <!-- Submit button (not for MCQ) -->
          @if (currentItem()!.exercise.type !== 'mcq') {
            <button
              (click)="submit()"
              class="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition min-h-[44px]"
            >
              {{ currentItem()!.state === 'wrong_twice' ? 'Next →' : 'Check' }}
            </button>
          }

          @if (currentItem()!.state === 'wrong_twice') {
            <button (click)="next()" class="w-full text-gray-500 py-2 text-sm hover:text-gray-700 transition">
              Skip → (wrong answer)
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class PracticeTabComponent implements OnInit {
  @Input({ required: true }) lesson!: Lesson;
  @Output() completed = new EventEmitter<number>();

  readonly queue = signal<ExerciseState[]>([]);
  readonly currentIndex = signal(0);
  readonly correctCount = signal(0);
  readonly totalAnswered = signal(0);

  userInput = '';
  private mcqShuffled: string[] = [];
  readonly builtSentence = signal<string[]>([]);
  readonly remainingWords = signal<string[]>([]);

  ngOnInit() {
    const shuffled = shuffle(this.lesson.exercises);
    this.queue.set(shuffled.map(e => ({
      exercise: e,
      state: 'unanswered' as AnswerState,
      userAnswer: '',
      showHint: false,
      showExplanation: false,
    })));
    this.initCurrentExercise();
  }

  readonly currentItem = computed(() => this.queue()[this.currentIndex()] ?? null);

  readonly answeredCount = computed(() =>
    this.queue().filter(e => e.state !== 'unanswered').length
  );

  readonly progressPct = computed(() => {
    const total = this.queue().length;
    return total ? Math.round((this.answeredCount() / total) * 100) : 0;
  });

  readonly finalScore = computed(() => {
    const answered = this.queue().filter(e => e.state !== 'unanswered');
    const correct = answered.filter(e => e.state === 'correct').length;
    return answered.length ? correct / answered.length : 0;
  });

  readonly scoreDisplay = computed(() => {
    const pct = Math.round(this.finalScore() * 100);
    return `${pct}%`;
  });

  readonly passMark = computed(() => this.finalScore() >= 0.7);

  readonly done = computed(() => {
    const q = this.queue();
    return q.length > 0 && this.currentIndex() >= q.length;
  });

  readonly mcqOptions = computed(() => this.mcqShuffled);

  private initCurrentExercise() {
    const item = this.currentItem();
    if (!item) return;
    this.userInput = '';
    if (item.exercise.type === 'mcq') {
      const opts = [item.exercise.answer, ...(item.exercise.distractors ?? [])];
      this.mcqShuffled = shuffle(opts);
    }
    if (item.exercise.type === 'sentence_builder') {
      this.builtSentence.set([]);
      this.remainingWords.set(shuffle(item.exercise.words ?? []));
    }
    if (item.exercise.type === 'error_correction') {
      this.userInput = item.exercise.question;
    }
  }

  addWord(word: string, idx: number) {
    const rem = [...this.remainingWords()];
    rem.splice(idx, 1);
    this.remainingWords.set(rem);
    this.builtSentence.update(s => [...s, word]);
  }

  removeWord(idx: number) {
    const built = [...this.builtSentence()];
    const word = built.splice(idx, 1)[0];
    this.builtSentence.update(() => built);
    this.remainingWords.update(r => [...r, word]);
  }

  selectMcq(option: string) {
    const item = this.currentItem();
    if (!item || item.state !== 'unanswered') return;
    this.userInput = option;
    this.submit();
  }

  submit() {
    const item = this.currentItem();
    if (!item) return;

    // If already wrong twice, just advance
    if (item.state === 'wrong_twice') { this.next(); return; }

    const answer = item.exercise.type === 'sentence_builder'
      ? this.builtSentence().join(' ')
      : this.userInput.trim();

    const correct = answer.toLowerCase() === item.exercise.answer.toLowerCase();

    this.queue.update(q => {
      const updated = [...q];
      const cur = { ...updated[this.currentIndex()] };
      if (correct) {
        cur.state = 'correct';
        this.correctCount.update(n => n + 1);
        this.totalAnswered.update(n => n + 1);
      } else if (cur.state === 'unanswered') {
        cur.state = 'wrong_once';
        cur.showHint = true;
      } else if (cur.state === 'wrong_once') {
        cur.state = 'wrong_twice';
        cur.showExplanation = true;
        this.totalAnswered.update(n => n + 1);
      }
      updated[this.currentIndex()] = cur;
      return updated;
    });

    if (correct) {
      setTimeout(() => this.next(), 600);
    }
  }

  next() {
    const item = this.currentItem();
    // Re-queue wrong-once items at the end
    if (item?.state === 'wrong_once') {
      this.queue.update(q => [...q, { ...item, state: 'unanswered', showHint: false, userAnswer: '' }]);
    }
    this.currentIndex.update(i => i + 1);
    this.initCurrentExercise();
  }
}
```

Update `lesson-player.component.ts` imports to include `PracticeTabComponent`:
```typescript
import { PracticeTabComponent } from './practice-tab.component';
// add to imports array
```

---

### Task 4: Wire imports + build + write tests

**Step 1: Final import wiring in lesson-player.component.ts**

Make sure `lesson-player.component.ts` has in its `imports` array:
```typescript
imports: [CommonModule, RouterLink, ExplainTabComponent, PracticeTabComponent],
```

**Step 2: Build**

```bash
cd C:\Coding\einav-english-learn\app
ng build --configuration=development 2>&1 | tail -8
```
Expected: no errors.

**Step 3: Write tests for LessonPlayerComponent**

Create `C:\Coding\einav-english-learn\app\src\app\features\lesson\lesson-player.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { LessonPlayerComponent } from './lesson-player.component';
import { LessonService } from '../../core/services/lesson.service';
import { of, throwError } from 'rxjs';

const mockLesson = {
  id: 'G-01', title: 'Present simple', level: 'A2', order: 1,
  explain: {
    rule: 'Use the present simple for habits.', why_matters: 'Very common.',
    hebrew_note: 'Hebrew note.', tip: 'A tip.',
    good_examples: [{ id: 'e1', sentence: 'I run.', audio_text: 'I run.' }],
    bad_examples: [{ id: 'b1', wrong: 'I runs.', correct: 'I run.', reason: 'No -s for I.' }],
  },
  exercises: Array.from({ length: 20 }, (_, i) => ({
    id: `G-01-ex-${String(i+1).padStart(3,'0')}`,
    type: 'fill_blank' as const,
    question: `Q${i+1}`, answer: `A${i+1}`, hint: 'hint', explanation: 'exp',
  })),
  speak: [{ id: 'G-01-sp-001', sentence: 'I run daily.', chunks: ['I run', 'daily'], phonetic_hints: '', pass_threshold: 0.7 }],
};

describe('LessonPlayerComponent', () => {
  let fixture: ComponentFixture<LessonPlayerComponent>;
  let component: LessonPlayerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonPlayerComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'G-01' } } } },
        { provide: LessonService, useValue: { getLesson: () => of(mockLesson) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load lesson and show title', () => {
    expect(component.lesson()?.title).toBe('Present simple');
    expect(component.loading()).toBeFalse();
  });

  it('should start on explain tab', () => {
    expect(component.activeTab()).toBe('explain');
  });

  it('should lock speak tab initially', () => {
    expect(component.practiceUnlocked()).toBeFalse();
  });

  it('should unlock speak tab when practice score >= 0.7', () => {
    component.onPracticeComplete(0.75);
    expect(component.practiceUnlocked()).toBeTrue();
  });

  it('should NOT unlock speak tab when score < 0.7', () => {
    component.onPracticeComplete(0.5);
    expect(component.practiceUnlocked()).toBeFalse();
  });
});
```

**Step 4: Run tests**

```bash
npx ng test --watch=false --include="**/lesson-player.component.spec.ts" 2>&1 | tail -10
```
Expected: `6 specs, 0 failures`

**Step 5: Run all tests**

```bash
npx ng test --watch=false 2>&1 | tail -10
```
Expected: all specs pass, 0 failures.

**Step 6: Commit**

```bash
cd C:\Coding\einav-english-learn
git add app/src/app/features/lesson/ app/src/app/app.routes.ts
git commit -m "feat: Phase 4 lesson player — Explain tab + 4 exercise types + scoring"
```

---

## Phase 4 Done — Verify Checklist

- [ ] `LessonPlayerComponent` at `/lesson/:id` loads lesson JSON via `LessonService`
- [ ] Explain tab: rule, Hebrew note, tip, good/bad examples, "Start practising" button
- [ ] Practice tab: 20+ exercises shuffled, score tracked, hint after 1st wrong, explanation after 2nd
- [ ] All 4 types work: fill_blank, mcq, error_correction, sentence_builder
- [ ] Wrong answers re-queued once at end
- [ ] Speak tab locked until score ≥ 70%
- [ ] `ng build --configuration=development` passes
- [ ] 6 lesson-player tests pass
- [ ] Commit made
