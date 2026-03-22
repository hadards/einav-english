# Phase 3 — Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the main dashboard — level tabs (A2/B1/B2), a responsive lesson card grid, card states (not_started/in_progress/completed), and a mobile bottom navigation bar — all wired to `SyllabusService` with stub progress data.

**Architecture:** Replace the stub `DashboardComponent` with a real implementation. `SyllabusService` provides all 54 entries; progress is stubbed as `not_started` for all entries (Phase 8 adds real DB progress). Cards are lazy-loaded by level tab. Mobile-first Tailwind layout: single column on mobile, 2–3 columns on desktop. Bottom nav bar on mobile only.

**Tech Stack:** Angular 20 standalone components, Angular signals, Tailwind CSS v3, Angular Router.

---

### Task 1: Replace stub DashboardComponent with real dashboard

**Files:**
- Replace: `app/src/app/features/dashboard/dashboard.component.ts`

**Step 1: Write the implementation**

Replace `C:\Coding\einav-english-learn\app\src\app\features\dashboard\dashboard.component.ts` with:

```typescript
import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SyllabusService } from '../../core/services/syllabus.service';
import { SyllabusEntry, ContentLevel } from '@shared/syllabus.constants';
import { AuthService } from '../../core/services/auth.service';

type LessonStatus = 'not_started' | 'in_progress' | 'completed';

interface LessonCard extends SyllabusEntry {
  status: LessonStatus;
  score?: number;
}

const LEVELS: ContentLevel[] = ['A2', 'B1', 'B2'];

const LEVEL_COLORS: Record<ContentLevel, string> = {
  A2: 'bg-green-100 text-green-800',
  B1: 'bg-blue-100 text-blue-800',
  B2: 'bg-purple-100 text-purple-800',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20 lg:pb-0">

      <!-- Header -->
      <header class="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div class="max-w-5xl mx-auto flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900">English Learning App</h1>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500">{{ completionPct() }}% complete</span>
            <button
              (click)="signOut()"
              class="text-sm text-gray-500 hover:text-gray-800 transition min-h-[44px] px-3"
            >Sign out</button>
          </div>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-4 py-6 lg:px-8">

        <!-- Level tabs -->
        <div class="flex gap-2 mb-6">
          @for (level of levels; track level) {
            <button
              (click)="activeLevel.set(level)"
              [class]="tabClass(level)"
              class="px-5 py-2 rounded-full text-sm font-medium transition min-h-[44px]"
            >{{ level }}</button>
          }
        </div>

        <!-- Progress bar -->
        <div class="mb-6">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>{{ activeLevel() }} progress</span>
            <span>{{ levelCompletedCount() }} / {{ levelTotalCount() }}</span>
          </div>
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500 rounded-full transition-all duration-500"
              [style.width]="levelPct() + '%'"
            ></div>
          </div>
        </div>

        <!-- Lesson card grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (card of activeCards(); track card.id) {
            <div
              [class]="cardClass(card)"
              class="bg-white rounded-xl border p-4 flex flex-col gap-2 transition cursor-pointer hover:shadow-md"
              [routerLink]="card.status !== 'locked' ? ['/lesson', card.id] : null"
            >
              <!-- Top row: id + level badge -->
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono text-gray-400">{{ card.id }}</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full {{ levelBadge(card.level) }}">
                  {{ card.level }}
                </span>
              </div>

              <!-- Title -->
              <p class="font-semibold text-gray-800 text-sm leading-snug">{{ card.title }}</p>

              <!-- Type badge -->
              <span class="text-xs text-gray-400 capitalize">{{ card.type }}</span>

              <!-- Status indicator -->
              <div class="mt-auto pt-2 flex items-center gap-2">
                @if (card.status === 'completed') {
                  <span class="text-green-600 text-xs font-medium flex items-center gap-1">
                    ✓ Completed
                    @if (card.score !== undefined) {
                      <span class="text-gray-400">({{ card.score }}%)</span>
                    }
                  </span>
                } @else if (card.status === 'in_progress') {
                  <span class="text-blue-600 text-xs font-medium">● In progress</span>
                } @else {
                  <span class="text-gray-400 text-xs">Not started</span>
                }
              </div>
            </div>
          }
        </div>
      </main>

      <!-- Bottom nav (mobile only) -->
      <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex lg:hidden">
        <a routerLink="/dashboard" class="flex-1 flex flex-col items-center py-3 text-blue-600 min-h-[44px]">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
          <span class="text-xs mt-0.5">Home</span>
        </a>
        <a routerLink="/vocabulary" class="flex-1 flex flex-col items-center py-3 text-gray-400 min-h-[44px]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          <span class="text-xs mt-0.5">Vocab</span>
        </a>
        <a routerLink="/progress" class="flex-1 flex flex-col items-center py-3 text-gray-400 min-h-[44px]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          <span class="text-xs mt-0.5">Progress</span>
        </a>
      </nav>
    </div>
  `,
})
export class DashboardComponent {
  private syllabus = inject(SyllabusService);
  private auth = inject(AuthService);

  readonly levels = LEVELS;
  readonly activeLevel = signal<ContentLevel>('A2');

  private readonly allCards = computed<LessonCard[]>(() =>
    this.syllabus.getAll().map(e => ({ ...e, status: 'not_started' as LessonStatus }))
  );

  readonly activeCards = computed(() =>
    this.allCards().filter(c => c.level === this.activeLevel())
  );

  readonly completionPct = computed(() => {
    const all = this.allCards();
    const done = all.filter(c => c.status === 'completed').length;
    return all.length ? Math.round((done / all.length) * 100) : 0;
  });

  readonly levelTotalCount = computed(() => this.activeCards().length);

  readonly levelCompletedCount = computed(() =>
    this.activeCards().filter(c => c.status === 'completed').length
  );

  readonly levelPct = computed(() => {
    const total = this.levelTotalCount();
    return total ? Math.round((this.levelCompletedCount() / total) * 100) : 0;
  });

  tabClass(level: ContentLevel): string {
    return level === this.activeLevel()
      ? 'bg-blue-600 text-white shadow-sm'
      : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300';
  }

  cardClass(card: LessonCard): string {
    if (card.status === 'completed') return 'border-green-200 bg-green-50/30';
    if (card.status === 'in_progress') return 'border-blue-300';
    return 'border-gray-200';
  }

  levelBadge(level: ContentLevel): string {
    return LEVEL_COLORS[level];
  }

  signOut() {
    this.auth.signOut();
  }
}
```

**Step 2: Add stub routes for /vocabulary and /progress (to avoid 404 in the bottom nav)**

These will be real components in later phases. Add stubs to `app.routes.ts`:

Read current `app/src/app/app.routes.ts` first, then add:
```typescript
{
  path: 'vocabulary',
  loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  canActivate: [authGuard],
},
{
  path: 'progress',
  loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  canActivate: [authGuard],
},
```
(Both temporarily point to DashboardComponent — fixed in Phases 6 and 8.)

**Step 3: Add /lesson/:id stub route**

Also add a stub lesson route (real component in Phase 4):
```typescript
{
  path: 'lesson/:id',
  loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  canActivate: [authGuard],
},
```

**Step 4: Build and verify**

```bash
cd C:\Coding\einav-english-learn\app
ng build --configuration=development 2>&1 | tail -8
```
Expected: succeeds, no errors.

**Step 5: Commit**

```bash
cd C:\Coding\einav-english-learn
git add app/src/app/features/dashboard/ app/src/app/app.routes.ts
git commit -m "feat: Phase 3 dashboard — level tabs, card grid, mobile nav (stub progress)"
```

---

### Task 2: Write dashboard component tests

**Files:**
- Create: `app/src/app/features/dashboard/dashboard.component.spec.ts`

**Step 1: Write tests**

Create `C:\Coding\einav-english-learn\app\src\app\features\dashboard\dashboard.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { SyllabusService } from '../../core/services/syllabus.service';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;

  const mockAuth = {
    isLoggedIn$: signal(true),
    currentUser$: signal(null),
    signOut: jasmine.createSpy('signOut'),
    signInWithGoogle: jasmine.createSpy(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        SyllabusService,
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start on A2 level', () => {
    expect(component.activeLevel()).toBe('A2');
  });

  it('should show A2 cards by default', () => {
    const cards = component.activeCards();
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every(c => c.level === 'A2')).toBeTrue();
  });

  it('should switch to B1 when tab clicked', () => {
    component.activeLevel.set('B1');
    fixture.detectChanges();
    const cards = component.activeCards();
    expect(cards.every(c => c.level === 'B1')).toBeTrue();
  });

  it('should show 0% completion when all not_started', () => {
    expect(component.completionPct()).toBe(0);
  });

  it('should have all 54 cards across all levels', () => {
    const a2 = component.activeCards().length;
    component.activeLevel.set('B1');
    const b1 = component.activeCards().length;
    component.activeLevel.set('B2');
    const b2 = component.activeCards().length;
    expect(a2 + b1 + b2).toBe(54);
  });
});
```

**Step 2: Run tests**

```bash
cd C:\Coding\einav-english-learn\app
npx ng test --watch=false --include="**/dashboard.component.spec.ts" 2>&1 | tail -10
```
Expected: `6 specs, 0 failures`

**Step 3: Commit**

```bash
cd C:\Coding\einav-english-learn
git add app/src/app/features/dashboard/dashboard.component.spec.ts
git commit -m "test: add DashboardComponent unit tests"
```

---

## Phase 3 Done — Verify Checklist

- [ ] DashboardComponent has A2/B1/B2 level tabs
- [ ] Cards filtered by active level using computed signals
- [ ] Completion percentage shown in header
- [ ] Level progress bar shown per active level
- [ ] Card shows id, title, type, level badge, status
- [ ] Mobile bottom nav bar with Home/Vocab/Progress links (44px min height)
- [ ] Stub routes for /vocabulary, /progress, /lesson/:id
- [ ] `ng build --configuration=development` passes
- [ ] 6 dashboard tests pass
- [ ] 2 commits made
