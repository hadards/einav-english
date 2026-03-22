# Phase 6 — Vocabulary Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the `/vocabulary` route — a flashcard-style vocabulary module where users browse vocab sets by level, flip cards to see definitions, and step through all words with a pass/skip tracker.

**Architecture:** `VocabularyComponent` at `/vocabulary` lists all vocab sets from `SyllabusService` (filtered by `type === 'vocabulary'`), grouped by level. Clicking a set loads it via `VocabularyService` and opens a `VocabFlashcardComponent` that shows cards one at a time — front = word + part-of-speech, back = definition + example + collocations. Users mark each card "Got it" or "Skip". After finishing a set, show a summary. Back button returns to the set list. Signals throughout. No server call — pure client-side.

**Tech Stack:** Angular 20 standalone components, signals, computed signals, `VocabularyService`, `SyllabusService`, Angular Router, Tailwind CSS v3.

---

### Task 1: Create `VocabularyComponent` (set browser)

**Files:**
- Create: `app/src/app/features/vocabulary/vocabulary.component.ts`
- Modify: `app/src/app/app.routes.ts`

**Step 1: Create feature directory and component**

Create `C:\Coding\einav-english-learn\app\src\app\features\vocabulary\vocabulary.component.ts`:

```typescript
import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SyllabusService } from '../../core/services/syllabus.service';
import { VocabularyService } from '../../core/services/vocabulary.service';
import type { VocabSet } from '@shared/vocabulary.schema';
import type { ContentLevel } from '@shared/syllabus.constants';

type ViewState = 'list' | 'flashcard';

@Component({
  selector: 'app-vocabulary',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20 lg:pb-0">

      <!-- Header -->
      <header class="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div class="max-w-3xl mx-auto flex items-center gap-3">
          @if (view() === 'flashcard') {
            <button (click)="backToList()" class="text-blue-600 text-sm">← Back</button>
          } @else {
            <a routerLink="/dashboard" class="text-blue-600 text-sm">← Dashboard</a>
          }
          <h1 class="text-xl font-bold text-gray-900 ml-auto mr-auto">Vocabulary</h1>
        </div>
      </header>

      @if (view() === 'list') {
        <main class="max-w-3xl mx-auto px-4 py-6 lg:px-8">

          <!-- Level filter tabs -->
          <div class="flex gap-2 mb-6">
            @for (lvl of levels; track lvl) {
              <button
                (click)="activeLevel.set(lvl)"
                [class]="lvl === activeLevel() ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'"
                class="px-5 py-2 rounded-full text-sm font-medium transition min-h-[44px]"
              >{{ lvl }}</button>
            }
          </div>

          <!-- Set cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (entry of activeEntries(); track entry.id) {
              <button
                (click)="openSet(entry.id)"
                class="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md hover:border-blue-300 transition"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-mono text-gray-400">{{ entry.id }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">{{ entry.level }}</span>
                </div>
                <p class="font-semibold text-gray-800 text-sm">{{ entry.title }}</p>
                @if (loading() === entry.id) {
                  <p class="text-xs text-gray-400 mt-2">Loading...</p>
                }
              </button>
            }
          </div>
        </main>
      } @else if (view() === 'flashcard' && activeSet()) {
        <app-vocab-flashcard [vocabSet]="activeSet()!" (done)="backToList()" />
      }
    </div>
  `,
})
export class VocabularyComponent {
  private syllabusService = inject(SyllabusService);
  private vocabService = inject(VocabularyService);

  readonly levels: ContentLevel[] = ['A2', 'B1', 'B2'];
  readonly activeLevel = signal<ContentLevel>('A2');
  readonly view = signal<ViewState>('list');
  readonly activeSet = signal<VocabSet | null>(null);
  readonly loading = signal<string | null>(null);

  readonly allVocabEntries = computed(() =>
    this.syllabusService.getByType('vocabulary')
  );

  readonly activeEntries = computed(() =>
    this.allVocabEntries().filter(e => e.level === this.activeLevel())
  );

  openSet(id: string) {
    this.loading.set(id);
    this.vocabService.getVocabSet(id).subscribe({
      next: set => {
        this.activeSet.set(set);
        this.loading.set(null);
        this.view.set('flashcard');
      },
      error: () => {
        this.loading.set(null);
      },
    });
  }

  backToList() {
    this.view.set('list');
    this.activeSet.set(null);
  }
}
```

Note: `<app-vocab-flashcard>` will be created in Task 2. Build will fail until then.

**Step 2: Add import for `VocabFlashcardComponent` (placeholder — will be resolved in Task 2)**

After creating the flashcard component, add to the imports array:
```typescript
import { VocabFlashcardComponent } from './vocab-flashcard.component';
// imports: [RouterLink, VocabFlashcardComponent]
```

**Step 3: Update `app.routes.ts`**

Read `C:\Coding\einav-english-learn\app\src\app\app.routes.ts`.

Replace the stub vocabulary route:
```typescript
  {
    path: 'vocabulary',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
```
with:
```typescript
  {
    path: 'vocabulary',
    loadComponent: () => import('./features/vocabulary/vocabulary.component').then(m => m.VocabularyComponent),
    canActivate: [authGuard],
  },
```

---

### Task 2: Create `VocabFlashcardComponent`

**Files:**
- Create: `app/src/app/features/vocabulary/vocab-flashcard.component.ts`
- Modify: `app/src/app/features/vocabulary/vocabulary.component.ts` (add import)

**Step 1: Create the flashcard component**

Create `C:\Coding\einav-english-learn\app\src\app\features\vocabulary\vocab-flashcard.component.ts`:

```typescript
import { Component, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import type { VocabSet, WordEntry } from '@shared/vocabulary.schema';

type CardFace = 'front' | 'back';
type CardState = 'active' | 'got_it' | 'skipped';

interface CardItem {
  word: WordEntry;
  state: CardState;
}

@Component({
  selector: 'app-vocab-flashcard',
  standalone: true,
  template: `
    <div class="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">

      @if (done()) {
        <!-- Summary screen -->
        <div class="text-center py-10">
          <p class="text-4xl mb-3">{{ gotItCount() }}/{{ cards().length }} 🎉</p>
          <p class="text-lg font-semibold text-gray-800 mb-2">Set complete!</p>
          <p class="text-sm text-gray-500 mb-6">You knew {{ gotItCount() }} of {{ cards().length }} words.</p>
          <div class="flex flex-col gap-3">
            <button (click)="retry()" class="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition min-h-[44px]">
              Practice again
            </button>
            <button (click)="done_.emit()" class="text-gray-500 py-2 text-sm hover:text-gray-700 transition">
              Back to sets
            </button>
          </div>
        </div>
      } @else if (current()) {

        <!-- Progress -->
        <div>
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>{{ currentIndex() + 1 }} / {{ cards().length }}</span>
            <span class="text-green-600 font-medium">{{ gotItCount() }} known</span>
          </div>
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full bg-green-500 rounded-full transition-all" [style.width]="progressPct() + '%'"></div>
          </div>
        </div>

        <!-- Flashcard -->
        <div
          (click)="flip()"
          class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[240px] flex flex-col gap-3 cursor-pointer hover:shadow-md transition"
        >
          <!-- Front -->
          <div class="flex items-start justify-between">
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ current()!.word.word }}</p>
              <p class="text-sm text-gray-400 italic capitalize">{{ current()!.word.part_of_speech }}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
              {{ face() === 'front' ? 'Tap to reveal' : 'Tap to flip' }}
            </span>
          </div>

          <!-- Back (revealed) -->
          @if (face() === 'back') {
            <div class="flex flex-col gap-3 border-t border-gray-100 pt-3">
              <p class="text-gray-800 leading-relaxed">{{ current()!.word.definition }}</p>

              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Example</p>
                <p class="text-sm text-gray-600 italic">{{ current()!.word.example_sentences[0] }}</p>
              </div>

              @if (current()!.word.collocations.length) {
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Collocations</p>
                  <div class="flex flex-wrap gap-1">
                    @for (col of current()!.word.collocations; track col) {
                      <span class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">{{ col }}</span>
                    }
                  </div>
                </div>
              }

              @if (current()!.word.pronunciation_tip) {
                <p class="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  🔊 {{ current()!.word.pronunciation_tip }}
                </p>
              }
            </div>
          }
        </div>

        <!-- Action buttons (only visible when back is shown) -->
        @if (face() === 'back') {
          <div class="flex gap-3">
            <button
              (click)="markSkipped()"
              class="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-200 transition min-h-[44px]"
            >
              Not yet
            </button>
            <button
              (click)="markGotIt()"
              class="flex-1 bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 transition min-h-[44px]"
            >
              Got it ✓
            </button>
          </div>
        }

      }
    </div>
  `,
})
export class VocabFlashcardComponent implements OnInit {
  @Input({ required: true }) vocabSet!: VocabSet;
  @Output('done') done_ = new EventEmitter<void>();

  readonly cards = signal<CardItem[]>([]);
  readonly currentIndex = signal(0);
  readonly face = signal<CardFace>('front');

  ngOnInit() {
    this.initCards();
  }

  private initCards() {
    this.cards.set(this.vocabSet.words.map(w => ({ word: w, state: 'active' as CardState })));
    this.currentIndex.set(0);
    this.face.set('front');
  }

  readonly current = computed(() => this.cards()[this.currentIndex()] ?? null);

  readonly done = computed(() => {
    const c = this.cards();
    return c.length > 0 && this.currentIndex() >= c.length;
  });

  readonly gotItCount = computed(() =>
    this.cards().filter(c => c.state === 'got_it').length
  );

  readonly progressPct = computed(() => {
    const total = this.cards().length;
    return total ? Math.round((this.currentIndex() / total) * 100) : 0;
  });

  flip() {
    this.face.update(f => (f === 'front' ? 'back' : 'front'));
  }

  markGotIt() {
    this.updateCurrent(c => ({ ...c, state: 'got_it' }));
    this.advance();
  }

  markSkipped() {
    this.updateCurrent(c => ({ ...c, state: 'skipped' }));
    this.advance();
  }

  retry() {
    this.initCards();
  }

  private advance() {
    this.currentIndex.update(i => i + 1);
    this.face.set('front');
  }

  private updateCurrent(fn: (c: CardItem) => CardItem) {
    const idx = this.currentIndex();
    this.cards.update(cs => {
      const updated = [...cs];
      updated[idx] = fn(updated[idx]);
      return updated;
    });
  }
}
```

**Step 2: Wire `VocabFlashcardComponent` into `VocabularyComponent`**

Read `C:\Coding\einav-english-learn\app\src\app\features\vocabulary\vocabulary.component.ts`.

Add the import:
```typescript
import { VocabFlashcardComponent } from './vocab-flashcard.component';
```

Update the `imports` array:
```typescript
imports: [RouterLink, VocabFlashcardComponent],
```

**Step 3: Build**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; ng build --configuration=development 2>&1 | Select-Object -Last 8"
```
Expected: succeeds, no errors.

**Step 4: Commit**

```bash
powershell -Command "cd C:\Coding\einav-english-learn; git add app/src/app/features/vocabulary/ app/src/app/app.routes.ts; git commit -m 'feat: Phase 6 vocabulary module — flashcard set browser + VocabFlashcardComponent'"
```

---

### Task 3: Write tests

**Files:**
- Create: `app/src/app/features/vocabulary/vocabulary.component.spec.ts`
- Create: `app/src/app/features/vocabulary/vocab-flashcard.component.spec.ts`

**Step 1: Create `VocabularyComponent` tests**

Create `C:\Coding\einav-english-learn\app\src\app\features\vocabulary\vocabulary.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { VocabularyComponent } from './vocabulary.component';
import { SyllabusService } from '../../core/services/syllabus.service';
import { VocabularyService } from '../../core/services/vocabulary.service';
import type { VocabSet } from '@shared/vocabulary.schema';

const mockVocabSet: VocabSet = {
  id: 'V-01',
  theme: 'Daily Life',
  level: 'A2',
  words: Array.from({ length: 15 }, (_, i) => ({
    id: `V-01-w-${String(i + 1).padStart(3, '0')}`,
    word: `word${i + 1}`,
    part_of_speech: 'noun' as const,
    definition: `Definition ${i + 1}`,
    example_sentences: [`Example 1`, `Example 2`, `Example 3`],
    pronunciation_tip: 'tip',
    common_mistake: 'mistake',
    collocations: ['col1'],
    difficulty: 1 as const,
  })),
};

describe('VocabularyComponent', () => {
  let fixture: ComponentFixture<VocabularyComponent>;
  let component: VocabularyComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VocabularyComponent],
      providers: [
        provideRouter([]),
        SyllabusService,
        { provide: VocabularyService, useValue: { getVocabSet: () => of(mockVocabSet) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VocabularyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start on list view', () => {
    expect(component.view()).toBe('list');
  });

  it('should start on A2 level', () => {
    expect(component.activeLevel()).toBe('A2');
  });

  it('activeEntries() filters by level', () => {
    const a2 = component.activeEntries();
    expect(a2.every(e => e.level === 'A2')).toBeTrue();
  });

  it('openSet() switches to flashcard view', async () => {
    const entry = component.activeEntries()[0];
    component.openSet(entry.id);
    expect(component.view()).toBe('flashcard');
    expect(component.activeSet()).toBeTruthy();
  });

  it('backToList() resets to list view', () => {
    component.openSet(component.activeEntries()[0].id);
    component.backToList();
    expect(component.view()).toBe('list');
    expect(component.activeSet()).toBeNull();
  });
});
```

**Step 2: Create `VocabFlashcardComponent` tests**

Create `C:\Coding\einav-english-learn\app\src\app\features\vocabulary\vocab-flashcard.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VocabFlashcardComponent } from './vocab-flashcard.component';
import type { VocabSet } from '@shared/vocabulary.schema';

const mockVocabSet: VocabSet = {
  id: 'V-01',
  theme: 'Daily Life',
  level: 'A2',
  words: Array.from({ length: 15 }, (_, i) => ({
    id: `V-01-w-${String(i + 1).padStart(3, '0')}`,
    word: `word${i + 1}`,
    part_of_speech: 'noun' as const,
    definition: `Definition ${i + 1}`,
    example_sentences: [`Ex A`, `Ex B`, `Ex C`],
    pronunciation_tip: 'tip',
    common_mistake: 'mistake',
    collocations: ['col1'],
    difficulty: 1 as const,
  })),
};

describe('VocabFlashcardComponent', () => {
  let fixture: ComponentFixture<VocabFlashcardComponent>;
  let component: VocabFlashcardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VocabFlashcardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VocabFlashcardComponent);
    component = fixture.componentInstance;
    component.vocabSet = mockVocabSet;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialise with 15 cards', () => {
    expect(component.cards().length).toBe(15);
  });

  it('should start on card 0 face-front', () => {
    expect(component.currentIndex()).toBe(0);
    expect(component.face()).toBe('front');
  });

  it('flip() toggles face', () => {
    component.flip();
    expect(component.face()).toBe('back');
    component.flip();
    expect(component.face()).toBe('front');
  });

  it('markGotIt() advances and resets face', () => {
    component.flip(); // reveal back first
    component.markGotIt();
    expect(component.currentIndex()).toBe(1);
    expect(component.face()).toBe('front');
    expect(component.cards()[0].state).toBe('got_it');
  });

  it('markSkipped() advances and marks skipped', () => {
    component.flip();
    component.markSkipped();
    expect(component.currentIndex()).toBe(1);
    expect(component.cards()[0].state).toBe('skipped');
  });

  it('done() is true after all cards advanced', () => {
    for (let i = 0; i < 15; i++) {
      component.markGotIt();
    }
    expect(component.done()).toBeTrue();
  });

  it('gotItCount() increments on markGotIt', () => {
    component.markGotIt();
    component.markGotIt();
    expect(component.gotItCount()).toBe(2);
  });

  it('retry() resets cards and index', () => {
    component.markGotIt();
    component.retry();
    expect(component.currentIndex()).toBe(0);
    expect(component.cards().every(c => c.state === 'active')).toBeTrue();
  });
});
```

**Step 3: Run tests**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; npx ng test --watch=false --include='**/vocabulary/**/*.spec.ts' 2>&1 | Select-Object -Last 10"
```
Expected: `15 specs, 0 failures` (6 vocabulary + 9 flashcard)

**Step 4: Run all tests**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; npx ng test --watch=false 2>&1 | Select-Object -Last 6"
```
Expected: all pass, only the pre-existing `app.spec.ts` failure acceptable.

**Step 5: Commit**

```bash
powershell -Command "cd C:\Coding\einav-english-learn; git add app/src/app/features/vocabulary/; git commit -m 'test: add VocabularyComponent and VocabFlashcardComponent tests'"
```

---

## Phase 6 Done — Verify Checklist

- [ ] `VocabularyComponent` at `/vocabulary` with level tabs (A2/B1/B2)
- [ ] Vocab set cards list for active level
- [ ] Clicking a set opens `VocabFlashcardComponent` (in-page, no new route)
- [ ] Flashcard: front = word + part_of_speech; back = definition + example + collocations + pronunciation tip
- [ ] Tap card to flip front ↔ back
- [ ] "Got it ✓" marks word and advances
- [ ] "Not yet" skips and advances
- [ ] Progress bar + X/N counter
- [ ] Summary screen with "Practice again" (retry) and "Back to sets"
- [ ] `ng build --configuration=development` passes
- [ ] 15 tests pass (6 + 9)
- [ ] 2 commits made
