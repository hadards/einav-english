# Phase 5 — Speaking Practice Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Speak tab — display each `SpeakSentence` from the lesson JSON, record the user's voice via the Web Speech API (`SpeechRecognition`), score the transcript against the target sentence, and show pass/fail feedback per sentence with an overall completion state.

**Architecture:** `SpeakTabComponent` receives the `lesson` Input. It iterates `lesson.speak` sentences one at a time. For each sentence it shows the text, a record button that triggers `SpeechRecognition`, and then computes a similarity score (normalised word overlap) against the `sentence` field. A score >= `pass_threshold` marks that sentence as passed. After all sentences are completed (or skipped), emit `completed` with the ratio of passed sentences. The Web Speech API is accessed via `window.SpeechRecognition || window.webkitSpeechRecognition`; if unavailable, show a graceful fallback. No backend call — pure client-side.

**Tech Stack:** Angular 20 standalone components, Angular signals, Web Speech API (`SpeechRecognition`), Tailwind CSS v3.

---

### Task 1: Create `SpeakTabComponent` with Web Speech API integration

**Files:**
- Create: `app/src/app/features/lesson/speak-tab.component.ts`
- Modify: `app/src/app/features/lesson/lesson-player.component.ts` (import + wire the Speak tab)

**Step 1: Create `speak-tab.component.ts`**

Create `C:\Coding\einav-english-learn\app\src\app\features\lesson\speak-tab.component.ts`:

```typescript
import { Component, Input, Output, EventEmitter, signal, computed, OnDestroy } from '@angular/core';
import type { Lesson, SpeakSentence } from '@shared/lesson.schema';

type SentenceState = 'waiting' | 'recording' | 'passed' | 'failed' | 'skipped';

interface SentenceResult {
  sentence: SpeakSentence;
  state: SentenceState;
  transcript: string;
  score: number;
}

/** Normalised word-overlap similarity (0–1). Case-insensitive, punctuation stripped. */
function similarity(a: string, b: string): number {
  const words = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const wa = words(a);
  const wb = words(b);
  if (!wa.length || !wb.length) return 0;
  const setA = new Set(wa);
  const overlap = wb.filter(w => setA.has(w)).length;
  return overlap / Math.max(wa.length, wb.length);
}

@Component({
  selector: 'app-speak-tab',
  standalone: true,
  template: `
    <div class="flex flex-col gap-6">

      @if (!speechSupported) {
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800 text-sm">
          <p class="font-semibold mb-1">Speech recognition not available</p>
          <p>Your browser does not support the Web Speech API. Try Chrome on desktop or Android.</p>
        </div>
      } @else if (allDone()) {
        <!-- Completion screen -->
        <div class="text-center py-10">
          <p class="text-4xl mb-3">{{ passedCount() }}/{{ results().length }} {{ passedCount() === results().length ? '🎉' : '💪' }}</p>
          <p class="text-lg font-semibold text-gray-800 mb-1">
            {{ passedCount() === results().length ? 'Perfect speaking!' : 'Speaking practice done' }}
          </p>
          <p class="text-sm text-gray-500 mb-6">You passed {{ passedCount() }} of {{ results().length }} sentences.</p>
          <button
            (click)="completed.emit(passedCount() / results().length)"
            class="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition min-h-[44px]"
          >
            Finish lesson →
          </button>
        </div>
      } @else {
        <!-- Progress -->
        <div>
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>Sentence {{ currentIndex() + 1 }} of {{ results().length }}</span>
            <span class="text-blue-600 font-medium">{{ passedCount() }} passed</span>
          </div>
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full bg-blue-500 rounded-full transition-all" [style.width]="progressPct() + '%'"></div>
          </div>
        </div>

        @if (current()) {
          <div class="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">

            <!-- Sentence to read -->
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Say this sentence</p>
              <p class="text-lg font-medium text-gray-900 leading-relaxed">{{ current()!.sentence.sentence }}</p>
              @if (current()!.sentence.phonetic_hints) {
                <p class="text-xs text-gray-400 mt-1 italic">{{ current()!.sentence.phonetic_hints }}</p>
              }
            </div>

            <!-- Recording state -->
            @if (current()!.state === 'recording') {
              <div class="flex items-center gap-3 text-red-500">
                <span class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                <span class="text-sm font-medium">Listening... speak now</span>
              </div>
            }

            <!-- Transcript result -->
            @if (current()!.transcript) {
              <div class="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
                <span class="text-gray-400 text-xs font-semibold uppercase mr-2">You said:</span>{{ current()!.transcript }}
              </div>
            }

            <!-- Result feedback -->
            @if (current()!.state === 'passed') {
              <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 font-medium">
                ✓ Great! Score: {{ pct(current()!.score) }}%
              </div>
            } @else if (current()!.state === 'failed') {
              <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                Score: {{ pct(current()!.score) }}% — need {{ pct(current()!.sentence.pass_threshold) }}% to pass
              </div>
            }

            <!-- Action buttons -->
            <div class="flex gap-3">
              @if (current()!.state === 'waiting' || current()!.state === 'failed') {
                <button
                  (click)="startRecording()"
                  class="flex-1 bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition min-h-[44px]"
                >
                  {{ current()!.state === 'failed' ? 'Try again' : '🎤 Record' }}
                </button>
              }
              @if (current()!.state === 'recording') {
                <button
                  (click)="stopRecording()"
                  class="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold hover:bg-red-700 transition min-h-[44px]"
                >
                  ■ Stop
                </button>
              }
              @if (current()!.state === 'passed') {
                <button
                  (click)="advance()"
                  class="flex-1 bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 transition min-h-[44px]"
                >
                  Next →
                </button>
              }
              @if (current()!.state !== 'recording' && current()!.state !== 'passed') {
                <button
                  (click)="skip()"
                  class="px-4 py-3 text-gray-400 text-sm hover:text-gray-600 transition min-h-[44px]"
                >
                  Skip
                </button>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class SpeakTabComponent implements OnDestroy {
  @Input({ required: true }) lesson!: Lesson;
  @Output() completed = new EventEmitter<number>();

  readonly speechSupported: boolean =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);

  readonly results = signal<SentenceResult[]>([]);
  readonly currentIndex = signal(0);

  private recognition: any = null;

  ngOnInit() {
    this.results.set(
      this.lesson.speak.map(s => ({
        sentence: s,
        state: 'waiting' as SentenceState,
        transcript: '',
        score: 0,
      }))
    );
  }

  readonly current = computed(() => this.results()[this.currentIndex()] ?? null);

  readonly allDone = computed(() => {
    const r = this.results();
    return r.length > 0 && this.currentIndex() >= r.length;
  });

  readonly passedCount = computed(() =>
    this.results().filter(r => r.state === 'passed').length
  );

  readonly progressPct = computed(() => {
    const total = this.results().length;
    return total ? Math.round((this.currentIndex() / total) * 100) : 0;
  });

  pct(v: number): number {
    return Math.round(v * 100);
  }

  startRecording() {
    if (!this.speechSupported) return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.updateCurrent(r => ({ ...r, state: 'recording', transcript: '' }));

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.handleTranscript(transcript);
    };

    this.recognition.onerror = () => {
      this.updateCurrent(r => ({ ...r, state: 'failed', transcript: '', score: 0 }));
    };

    this.recognition.onend = () => {
      // If still recording (no result fired), treat as empty
      const cur = this.current();
      if (cur?.state === 'recording') {
        this.updateCurrent(r => ({ ...r, state: 'failed', transcript: '', score: 0 }));
      }
      this.recognition = null;
    };

    this.recognition.start();
  }

  stopRecording() {
    this.recognition?.stop();
  }

  private handleTranscript(transcript: string) {
    const cur = this.current();
    if (!cur) return;
    const score = similarity(transcript, cur.sentence.sentence);
    const passed = score >= cur.sentence.pass_threshold;
    this.updateCurrent(r => ({
      ...r,
      transcript,
      score,
      state: passed ? 'passed' : 'failed',
    }));
    if (passed) {
      setTimeout(() => this.advance(), 1200);
    }
  }

  advance() {
    this.currentIndex.update(i => i + 1);
  }

  skip() {
    this.updateCurrent(r => ({ ...r, state: 'skipped' }));
    this.currentIndex.update(i => i + 1);
  }

  private updateCurrent(fn: (r: SentenceResult) => SentenceResult) {
    const idx = this.currentIndex();
    this.results.update(rs => {
      const updated = [...rs];
      updated[idx] = fn(updated[idx]);
      return updated;
    });
  }

  ngOnDestroy() {
    this.recognition?.stop();
  }
}
```

**Step 2: Wire `SpeakTabComponent` into `LessonPlayerComponent`**

Read `C:\Coding\einav-english-learn\app\src\app\features\lesson\lesson-player.component.ts`.

Add the import at the top:
```typescript
import { SpeakTabComponent } from './speak-tab.component';
```

Add `SpeakTabComponent` to the `imports` array:
```typescript
imports: [CommonModule, RouterLink, ExplainTabComponent, PracticeTabComponent, SpeakTabComponent],
```

Replace the placeholder speak tab content in the template:
```html
          } @else {
            <div class="text-center text-gray-500 py-12">
              <p class="text-lg font-medium mb-2">Speaking practice</p>
              <p class="text-sm">Coming in Phase 5</p>
            </div>
          }
```
with:
```html
          } @else {
            <app-speak-tab [lesson]="lesson()!" (completed)="onSpeakComplete($event)" />
          }
```

Add the `onSpeakComplete` method to `LessonPlayerComponent` class:
```typescript
  readonly speakScore = signal<number | null>(null);

  onSpeakComplete(score: number) {
    this.speakScore.set(score);
  }
```

**Step 3: Build**

```bash
cd C:\Coding\einav-english-learn\app
ng build --configuration=development 2>&1 | tail -8
```
Expected: succeeds, no errors.

**Step 4: Commit**

```bash
cd C:\Coding\einav-english-learn
git add app/src/app/features/lesson/speak-tab.component.ts app/src/app/features/lesson/lesson-player.component.ts
git commit -m "feat: Phase 5 speaking practice — SpeakTabComponent with Web Speech API"
```

---

### Task 2: Write `SpeakTabComponent` tests

**Files:**
- Create: `app/src/app/features/lesson/speak-tab.component.spec.ts`

**Step 1: Write tests**

Create `C:\Coding\einav-english-learn\app\src\app\features\lesson\speak-tab.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SpeakTabComponent } from './speak-tab.component';
import type { Lesson } from '@shared/lesson.schema';

const speakSentences = Array.from({ length: 5 }, (_, i) => ({
  id: `G-01-sp-${String(i + 1).padStart(3, '0')}`,
  sentence: `I run every day sentence ${i + 1}`,
  chunks: ['I run', 'every day'],
  phonetic_hints: '',
  pass_threshold: 0.7,
}));

const mockLesson: Partial<Lesson> = {
  id: 'G-01',
  title: 'Present simple',
  level: 'A2',
  explain: {
    rule: 'Use present simple for habits.',
    why_matters: 'Very common.',
    hebrew_note: 'Hebrew note.',
    tip: 'A tip.',
    good_examples: [{ id: 'e1', sentence: 'I run.', audio_text: 'I run.' }],
    bad_examples: [{ id: 'b1', wrong: 'I runs.', correct: 'I run.', reason: 'No -s for I.' }],
  },
  exercises: Array.from({ length: 20 }, (_, i) => ({
    id: `G-01-ex-${String(i + 1).padStart(3, '0')}`,
    type: 'fill_blank' as const,
    question: `Q${i + 1}`, answer: `A${i + 1}`, hint: 'hint', explanation: 'exp',
  })),
  speak: speakSentences,
};

// Stub SpeechRecognition so tests don't require browser API
class MockSpeechRecognition {
  lang = '';
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((e: any) => void) | null = null;
  onerror: (() => void) | null = null;
  onend: (() => void) | null = null;
  start() {}
  stop() {}
}

describe('SpeakTabComponent', () => {
  let fixture: ComponentFixture<SpeakTabComponent>;
  let component: SpeakTabComponent;

  beforeEach(async () => {
    // Install stub before component creation
    (window as any).SpeechRecognition = MockSpeechRecognition;

    await TestBed.configureTestingModule({
      imports: [SpeakTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpeakTabComponent);
    component = fixture.componentInstance;
    component.lesson = mockLesson as Lesson;
    fixture.detectChanges();
  });

  afterEach(() => {
    delete (window as any).SpeechRecognition;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialise with 5 sentences all waiting', () => {
    const results = component.results();
    expect(results.length).toBe(5);
    expect(results.every(r => r.state === 'waiting')).toBeTrue();
  });

  it('should start on sentence index 0', () => {
    expect(component.currentIndex()).toBe(0);
  });

  it('should not be allDone initially', () => {
    expect(component.allDone()).toBeFalse();
  });

  it('skip() advances to next sentence and marks as skipped', () => {
    component.skip();
    expect(component.currentIndex()).toBe(1);
    expect(component.results()[0].state).toBe('skipped');
  });

  it('advance() increments index', () => {
    component.advance();
    expect(component.currentIndex()).toBe(1);
  });

  it('allDone() returns true after skipping all sentences', () => {
    for (let i = 0; i < 5; i++) {
      component.skip();
    }
    expect(component.allDone()).toBeTrue();
  });

  it('passedCount() reflects correct count', () => {
    // Simulate 2 passed via internal handleTranscript
    (component as any).handleTranscript('I run every day sentence 1');
    component.advance();
    (component as any).handleTranscript('I run every day sentence 2');
    component.advance();
    expect(component.passedCount()).toBe(2);
  });
});
```

**Step 2: Run tests**

```bash
cd C:\Coding\einav-english-learn\app
npx ng test --watch=false --include="**/speak-tab.component.spec.ts" 2>&1 | tail -10
```
Expected: `8 specs, 0 failures`

**Step 3: Commit**

```bash
cd C:\Coding\einav-english-learn
git add app/src/app/features/lesson/speak-tab.component.spec.ts
git commit -m "test: add SpeakTabComponent unit tests"
```

---

## Phase 5 Done — Verify Checklist

- [ ] `SpeakTabComponent` created with Web Speech API (`SpeechRecognition`)
- [ ] Shows sentence text and phonetic hints
- [ ] Record button starts recognition; Stop button ends it
- [ ] Transcript displayed after recording
- [ ] Score computed as word-overlap similarity vs target sentence
- [ ] Pass/fail feedback shown per sentence (score vs pass_threshold)
- [ ] Auto-advances after a pass (1.2s delay)
- [ ] Skip button available when not recording / not passed
- [ ] Graceful fallback when `SpeechRecognition` not available
- [ ] Completion screen shows X/N passed with "Finish lesson" button
- [ ] `SpeakTabComponent` wired into `LessonPlayerComponent` (replaces stub)
- [ ] `ng build --configuration=development` passes
- [ ] 8 speak-tab tests pass
- [ ] 2 commits made
