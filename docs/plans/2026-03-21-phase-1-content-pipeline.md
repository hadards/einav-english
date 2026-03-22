# Phase 1 — Content Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Angular services that load lesson and vocabulary JSON from `/assets/`, wire up `HttpClient`, configure Angular environments for Supabase credentials, and verify end-to-end loading with a simple test component.

**Architecture:** Two Angular services (`LessonService`, `VocabularyService`) use `HttpClient` to fetch static JSON from `/assets/` — loaded on demand and cached in a `Map` to avoid re-fetching. A `SyllabusService` wraps the typed `SYLLABUS` constant and merges it with (stub) progress data. TypeScript types are inferred from the Zod schemas in `shared/`. Angular environments hold the Supabase anon key (the only frontend-safe credential).

**Tech Stack:** Angular 20 standalone, `HttpClient`, `HttpClientModule`/`provideHttpClient`, RxJS `Observable`, Zod (types only in Angular — no runtime validation in the browser for now), TypeScript strict mode.

---

## Prerequisites

- Working dir: `C:\Coding\einav-english-learn`
- Angular project: `app/`
- 36 lesson JSON files in `app/src/assets/lessons/`
- 18 vocab JSON files in `app/src/assets/vocabulary/`
- `shared/syllabus.constants.ts`, `shared/lesson.schema.ts`, `shared/vocabulary.schema.ts` already exist

---

### Task 1: Configure Angular environments and `provideHttpClient`

**Files:**
- Create: `app/src/environments/environment.ts`
- Create: `app/src/environments/environment.prod.ts`
- Modify: `app/src/app/app.config.ts`
- Modify: `app/angular.json`

**Step 1: Create environments folder and files**

Create `app/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'your_anon_key_here',
};
```

Create `app/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'your_anon_key_here',
};
```

**Step 2: Register environment file replacement in angular.json**

In `app/angular.json`, find `projects.app.architect.build.configurations.production` and add a `fileReplacements` array:

```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

Also add `src/environments/**` to the `assets` glob in `options` — actually environments are NOT assets, they're compiled in. Just add the fileReplacements to the production config.

**Step 3: Add `provideHttpClient` to app.config.ts**

Open `app/src/app/app.config.ts` and replace with:
```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
  ]
};
```

**Step 4: Verify build still passes**

From `app/`:
```bash
ng build --configuration=development
```
Expected: build succeeds, no errors.

**Step 5: Commit**
```bash
git add app/src/environments/ app/src/app/app.config.ts app/angular.json
git commit -m "feat: add environments + provideHttpClient (Phase 1)"
```

---

### Task 2: Add path aliases so Angular can import from `shared/`

**Files:**
- Modify: `app/tsconfig.json`
- Modify: `app/tsconfig.app.json`

**Context:** The `shared/` folder sits at the repo root (`C:\Coding\einav-english-learn\shared\`), outside the Angular `app/` project. We need TypeScript path aliases so Angular components can import with `@shared/lesson.schema` instead of `../../../shared/lesson.schema`.

**Step 1: Add path alias to `app/tsconfig.json`**

Open `app/tsconfig.json`. In `compilerOptions`, add:
```json
"baseUrl": ".",
"paths": {
  "@shared/*": ["../shared/*"]
}
```

**Step 2: Update `app/tsconfig.app.json` includes**

Open `app/tsconfig.app.json`. The current `include` is `["src/**/*.ts"]`. We need shared files included too. Change to:
```json
"include": [
  "src/**/*.ts",
  "../shared/**/*.ts"
]
```

**Step 3: Verify TypeScript resolves the alias**

Create a temporary test file `app/src/test-alias.ts`:
```typescript
import { LessonSchema } from '@shared/lesson.schema';
import { SYLLABUS } from '@shared/syllabus.constants';

const count = SYLLABUS.length;
export { LessonSchema, count };
```

Run from `app/`:
```bash
npx tsc --noEmit
```
Expected: no errors.

Then delete `app/src/test-alias.ts`.

**Step 4: Commit**
```bash
git add app/tsconfig.json app/tsconfig.app.json
git commit -m "feat: add @shared path alias for repo-root shared/ folder"
```

---

### Task 3: Create `LessonService`

**Files:**
- Create: `app/src/app/core/services/lesson.service.ts`
- Create: `app/src/app/core/services/lesson.service.spec.ts`

**Step 1: Create the core/services directory**

```bash
mkdir -p app/src/app/core/services
```

**Step 2: Write the failing test first**

Create `app/src/app/core/services/lesson.service.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { LessonService } from './lesson.service';

describe('LessonService', () => {
  let service: LessonService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LessonService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(LessonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load a lesson via HttpClient', (done) => {
    const mockLesson = { id: 'G-01', title: 'Present simple', level: 'A2' };

    service.getLesson('G-01').subscribe((lesson) => {
      expect(lesson['id']).toBe('G-01');
      done();
    });

    const req = httpMock.expectOne('assets/lessons/G-01-present-simple.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockLesson);
  });

  it('should cache the lesson on second call', (done) => {
    const mockLesson = { id: 'G-01', title: 'Present simple', level: 'A2' };

    service.getLesson('G-01').subscribe(() => {
      // Second call — should return from cache, no new HTTP request
      service.getLesson('G-01').subscribe((cached) => {
        expect(cached['id']).toBe('G-01');
        httpMock.expectNone('assets/lessons/G-01-present-simple.json');
        done();
      });
    });

    const req = httpMock.expectOne('assets/lessons/G-01-present-simple.json');
    req.flush(mockLesson);
  });
});
```

**Step 3: Run the test — expect it to FAIL (service doesn't exist yet)**

From `app/`:
```bash
npx ng test --watch=false --include="**/lesson.service.spec.ts" 2>&1 | tail -15
```
Expected: FAILED — `Cannot find module './lesson.service'`

**Step 4: Create `lesson.service.ts`**

Create `app/src/app/core/services/lesson.service.ts`:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SYLLABUS } from '@shared/syllabus.constants';
import type { Lesson } from '@shared/lesson.schema';

@Injectable({ providedIn: 'root' })
export class LessonService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Lesson>();

  getLesson(id: string): Observable<Lesson> {
    const cached = this.cache.get(id);
    if (cached) return of(cached);

    const entry = SYLLABUS.find(e => e.id === id && e.type === 'grammar');
    if (!entry) throw new Error(`Unknown lesson id: ${id}`);

    return this.http.get<Lesson>(`assets/${entry.assetPath}`).pipe(
      tap(lesson => this.cache.set(id, lesson))
    );
  }
}
```

**Step 5: Run the tests — expect PASS**

From `app/`:
```bash
npx ng test --watch=false --include="**/lesson.service.spec.ts" 2>&1 | tail -15
```
Expected: `3 specs, 0 failures`

**Step 6: Commit**
```bash
git add app/src/app/core/
git commit -m "feat: add LessonService with HttpClient + Map cache"
```

---

### Task 4: Create `VocabularyService`

**Files:**
- Create: `app/src/app/core/services/vocabulary.service.ts`
- Create: `app/src/app/core/services/vocabulary.service.spec.ts`

**Step 1: Write the failing test**

Create `app/src/app/core/services/vocabulary.service.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { VocabularyService } from './vocabulary.service';

describe('VocabularyService', () => {
  let service: VocabularyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VocabularyService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(VocabularyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load a vocab set via HttpClient', (done) => {
    const mockSet = { id: 'V-01', theme: 'Daily life & routines', level: 'A2', words: [] };

    service.getVocabSet('V-01').subscribe((set) => {
      expect(set['id']).toBe('V-01');
      done();
    });

    const req = httpMock.expectOne('assets/vocabulary/V-01-daily-life.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockSet);
  });

  it('should cache the vocab set on second call', (done) => {
    const mockSet = { id: 'V-01', theme: 'Daily life & routines', level: 'A2', words: [] };

    service.getVocabSet('V-01').subscribe(() => {
      service.getVocabSet('V-01').subscribe((cached) => {
        expect(cached['id']).toBe('V-01');
        httpMock.expectNone('assets/vocabulary/V-01-daily-life.json');
        done();
      });
    });

    const req = httpMock.expectOne('assets/vocabulary/V-01-daily-life.json');
    req.flush(mockSet);
  });
});
```

**Step 2: Run test — expect FAIL**

```bash
npx ng test --watch=false --include="**/vocabulary.service.spec.ts" 2>&1 | tail -10
```
Expected: FAILED — `Cannot find module './vocabulary.service'`

**Step 3: Create `vocabulary.service.ts`**

Create `app/src/app/core/services/vocabulary.service.ts`:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SYLLABUS } from '@shared/syllabus.constants';
import type { VocabSet } from '@shared/vocabulary.schema';

@Injectable({ providedIn: 'root' })
export class VocabularyService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, VocabSet>();

  getVocabSet(id: string): Observable<VocabSet> {
    const cached = this.cache.get(id);
    if (cached) return of(cached);

    const entry = SYLLABUS.find(e => e.id === id && e.type === 'vocabulary');
    if (!entry) throw new Error(`Unknown vocab set id: ${id}`);

    return this.http.get<VocabSet>(`assets/${entry.assetPath}`).pipe(
      tap(set => this.cache.set(id, set))
    );
  }
}
```

**Step 4: Run tests — expect PASS**

```bash
npx ng test --watch=false --include="**/vocabulary.service.spec.ts" 2>&1 | tail -10
```
Expected: `3 specs, 0 failures`

**Step 5: Commit**
```bash
git add app/src/app/core/services/vocabulary.service.ts app/src/app/core/services/vocabulary.service.spec.ts
git commit -m "feat: add VocabularyService with HttpClient + Map cache"
```

---

### Task 5: Create `SyllabusService`

**Files:**
- Create: `app/src/app/core/services/syllabus.service.ts`
- Create: `app/src/app/core/services/syllabus.service.spec.ts`

**Context:** `SyllabusService` exposes the `SYLLABUS` constant and will later merge it with Supabase progress data. For Phase 1, it returns the static SYLLABUS entries with a stub `status: 'not_started'` for each. This lets the dashboard render without a real DB connection.

**Step 1: Write the failing test**

Create `app/src/app/core/services/syllabus.service.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { SyllabusService } from './syllabus.service';

describe('SyllabusService', () => {
  let service: SyllabusService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SyllabusService] });
    service = TestBed.inject(SyllabusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all 54 syllabus entries', () => {
    const entries = service.getAll();
    expect(entries.length).toBe(54);
  });

  it('should return 36 grammar lessons', () => {
    const grammar = service.getByType('grammar');
    expect(grammar.length).toBe(36);
  });

  it('should return 18 vocabulary sets', () => {
    const vocab = service.getByType('vocabulary');
    expect(vocab.length).toBe(18);
  });

  it('should return entries filtered by level', () => {
    const a2 = service.getByLevel('A2');
    expect(a2.length).toBeGreaterThan(0);
    expect(a2.every(e => e.level === 'A2')).toBeTrue();
  });

  it('should find a single entry by id', () => {
    const entry = service.getById('G-01');
    expect(entry).toBeDefined();
    expect(entry!.title).toBe('Present simple');
  });
});
```

**Step 2: Run test — expect FAIL**

```bash
npx ng test --watch=false --include="**/syllabus.service.spec.ts" 2>&1 | tail -10
```
Expected: FAILED

**Step 3: Create `syllabus.service.ts`**

Create `app/src/app/core/services/syllabus.service.ts`:
```typescript
import { Injectable } from '@angular/core';
import { SYLLABUS, SyllabusEntry, ContentLevel, ContentType } from '@shared/syllabus.constants';

@Injectable({ providedIn: 'root' })
export class SyllabusService {
  getAll(): SyllabusEntry[] {
    return SYLLABUS;
  }

  getByType(type: ContentType): SyllabusEntry[] {
    return SYLLABUS.filter(e => e.type === type);
  }

  getByLevel(level: ContentLevel): SyllabusEntry[] {
    return SYLLABUS.filter(e => e.level === level);
  }

  getById(id: string): SyllabusEntry | undefined {
    return SYLLABUS.find(e => e.id === id);
  }
}
```

**Step 4: Run tests — expect PASS**

```bash
npx ng test --watch=false --include="**/syllabus.service.spec.ts" 2>&1 | tail -10
```
Expected: `6 specs, 0 failures`

**Step 5: Commit**
```bash
git add app/src/app/core/services/syllabus.service.ts app/src/app/core/services/syllabus.service.spec.ts
git commit -m "feat: add SyllabusService wrapping SYLLABUS constant"
```

---

### Task 6: Smoke-test the services with a temporary DevComponent

**Files:**
- Create: `app/src/app/dev/dev.component.ts` (temporary — deleted after smoke test)
- Modify: `app/src/app/app.routes.ts` (temporary)
- Modify: `app/src/app/app.html` (temporary)

**Context:** We verify real HTTP loading works end-to-end before declaring Phase 1 done. We create a throwaway component that calls the services and renders results. We delete it at the end of this task.

**Step 1: Create DevComponent**

Create `app/src/app/dev/dev.component.ts`:
```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LessonService } from '../core/services/lesson.service';
import { VocabularyService } from '../core/services/vocabulary.service';
import { SyllabusService } from '../core/services/syllabus.service';

@Component({
  selector: 'app-dev',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 font-mono text-sm">
      <h1 class="text-2xl font-bold mb-4">Phase 1 Smoke Test</h1>

      <h2 class="font-bold mt-4">SYLLABUS ({{ entries.length }} entries)</h2>
      <ul>
        @for (e of entries.slice(0, 5); track e.id) {
          <li>{{ e.id }} — {{ e.title }} ({{ e.level }})</li>
        }
        <li>... and {{ entries.length - 5 }} more</li>
      </ul>

      @if (lesson) {
        <h2 class="font-bold mt-4">Lesson G-01: {{ lesson.title }}</h2>
        <p>Exercises: {{ lesson.exercises?.length }}</p>
        <p>Speak sentences: {{ lesson.speak?.length }}</p>
      } @else {
        <p class="mt-4 text-gray-500">Loading G-01...</p>
      }

      @if (vocabSet) {
        <h2 class="font-bold mt-4">Vocab V-01: {{ vocabSet.theme }}</h2>
        <p>Words: {{ vocabSet.words?.length }}</p>
      } @else {
        <p class="text-gray-500">Loading V-01...</p>
      }
    </div>
  `,
})
export class DevComponent implements OnInit {
  private lessonSvc = inject(LessonService);
  private vocabSvc = inject(VocabularyService);
  private syllabusSvc = inject(SyllabusService);

  entries = this.syllabusSvc.getAll();
  lesson: any = null;
  vocabSet: any = null;

  ngOnInit() {
    this.lessonSvc.getLesson('G-01').subscribe(l => this.lesson = l);
    this.vocabSvc.getVocabSet('V-01').subscribe(v => this.vocabSet = v);
  }
}
```

**Step 2: Add route**

Open `app/src/app/app.routes.ts` and replace with:
```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'dev', loadComponent: () => import('./dev/dev.component').then(m => m.DevComponent) },
];
```

**Step 3: Update app.html to include router-outlet**

Open `app/src/app/app.html` and replace with:
```html
<router-outlet />
```

**Step 4: Also re-add RouterOutlet import in app.ts**

Open `app/src/app/app.ts`. It should already import `RouterOutlet`. If not, add it to the imports array. The component template just needs `<router-outlet />`.

**Step 5: Serve and manually verify**

From `app/`:
```bash
ng serve --open
```

Navigate to `http://localhost:4200/dev`. You should see:
- "Phase 1 Smoke Test" heading
- List of 54 syllabus entries (first 5 shown)
- G-01 lesson loaded with exercise count (should be 20+) and speak count (should be 5+)
- V-01 vocab set loaded with word count (should be 20)

If data loads correctly, Phase 1 services are working end-to-end.

Stop the server with Ctrl+C.

**Step 6: Clean up dev component and revert routes**

Delete `app/src/app/dev/` folder.

Revert `app/src/app/app.routes.ts`:
```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [];
```

Revert `app/src/app/app.html` to the Tailwind placeholder:
```html
<div class="min-h-screen bg-blue-50 flex items-center justify-center">
  <h1 class="text-3xl font-bold text-blue-700">English Learning App</h1>
</div>
```

**Step 7: Final build check**

```bash
ng build --configuration=development 2>&1 | tail -5
```
Expected: build succeeds.

**Step 8: Commit**
```bash
git add app/src/app/
git commit -m "feat: Phase 1 content pipeline complete — LessonService, VocabularyService, SyllabusService"
```

---

## Phase 1 Done — Verify Checklist

- [ ] `app/src/environments/environment.ts` and `environment.prod.ts` exist
- [ ] `angular.json` has `fileReplacements` for prod config
- [ ] `app.config.ts` includes `provideHttpClient()`
- [ ] `app/tsconfig.json` has `@shared/*` path alias pointing to `../shared/*`
- [ ] `app/tsconfig.app.json` includes `../shared/**/*.ts`
- [ ] `LessonService` exists, loads lesson JSON by id, caches results
- [ ] `VocabularyService` exists, loads vocab JSON by id, caches results
- [ ] `SyllabusService` exists, wraps SYLLABUS constant with filter methods
- [ ] All service unit tests pass (`ng test --watch=false`)
- [ ] Smoke test confirmed real JSON loading works (G-01 has 20+ exercises, V-01 has 20 words)
- [ ] No dev component left in the codebase
- [ ] `ng build --configuration=development` passes
- [ ] Commit made

**Next: Phase 2 — Auth Flow (Google OAuth via Supabase, AuthGuard, login route)**
