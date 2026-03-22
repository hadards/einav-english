# Phase 9 — Polish & Deploy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish the app for production — fix the pre-existing `app.spec.ts` test failure, add a production build check, verify all routes work end-to-end, add `<title>` and PWA meta tags to `index.html`, and verify the Vercel production build succeeds with `ng build --configuration=production`.

**Architecture:** No new features. Cleanup only: fix the broken default test, add HTML meta tags, verify prod build, and check all 9 app routes are wired. This phase prepares the app for real deployment — the user still needs to set Supabase and Anthropic credentials in Vercel.

**Tech Stack:** Angular 20, Vercel, standard HTML meta tags.

---

### Task 1: Fix pre-existing `app.spec.ts` test failure

**Files:**
- Modify: `app/src/app/app.spec.ts`

**Step 1: Read the failing test**

Read `C:\Coding\einav-english-learn\app\src\app\app.spec.ts`.

The Angular CLI scaffold generates a test expecting `<title>Hello, app</title>`. Our app has a different title. Fix the test to match reality.

**Step 2: Run the failing test to confirm it fails**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; npx ng test --watch=false --include='**/app.spec.ts' 2>&1 | Select-Object -Last 8"
```

**Step 3: Fix the test**

After reading `app.spec.ts`, update the test expectation to match the actual app title (check `app/src/index.html` for the real `<title>`).

**Step 4: Run fixed test**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; npx ng test --watch=false --include='**/app.spec.ts' 2>&1 | Select-Object -Last 8"
```
Expected: pass.

**Step 5: Run all tests — confirm 0 failures**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; npx ng test --watch=false 2>&1 | Select-Object -Last 6"
```
Expected: ALL pass, 0 failures.

**Step 6: Commit**

```bash
powershell -Command "cd C:\Coding\einav-english-learn; git add app/src/app/app.spec.ts; git commit -m 'fix: update app.spec.ts to match actual app title'"
```

---

### Task 2: Polish `index.html` — meta tags + PWA ready

**Files:**
- Modify: `app/src/index.html`

**Step 1: Read current `index.html`**

Read `C:\Coding\einav-english-learn\app\src\index.html`.

**Step 2: Update `index.html`**

Replace the entire file with a polished version:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>English Learning App</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="description" content="Personalised English lessons for Hebrew speakers — grammar, vocabulary, speaking practice, and AI conversation.">
  <meta name="theme-color" content="#2563eb">

  <!-- Apple PWA -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="English App">

  <!-- Open Graph -->
  <meta property="og:title" content="English Learning App">
  <meta property="og:description" content="Personalised English lessons for Hebrew speakers">
  <meta property="og:type" content="website">

  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

**Step 3: Build**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; ng build --configuration=development 2>&1 | Select-Object -Last 5"
```

**Step 4: Commit**

```bash
powershell -Command "cd C:\Coding\einav-english-learn; git add app/src/index.html; git commit -m 'chore: polish index.html — meta tags, PWA, Open Graph'"
```

---

### Task 3: Production build verification

**Files:**
- Read: `app/src/environments/environment.prod.ts`
- No changes needed — just verification

**Step 1: Run production build**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; ng build --configuration=production 2>&1 | Select-Object -Last 10"
```
Expected: succeeds, no errors.

Note: The production build will use `environment.prod.ts` which has placeholder Supabase credentials. The build should still succeed because Supabase credentials are only used at runtime.

**Step 2: Check bundle sizes**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; ng build --configuration=production 2>&1 | Select-String 'kB'"
```
Review the output — ensure no single chunk exceeds 500 kB (gzipped). If any does, note it in the commit message.

**Step 3: Commit**

No code changes needed. Just record that the production build was verified:

```bash
powershell -Command "cd C:\Coding\einav-english-learn; git commit --allow-empty -m 'chore: verify production build passes — all chunks within budget'"
```

---

### Task 4: Final route audit + full test run

**Step 1: Verify all routes are wired**

Read `C:\Coding\einav-english-learn\app\src\app\app.routes.ts` and confirm all expected routes exist:
- `/` → redirects to `/login`
- `/login` → `LoginComponent`
- `/dashboard` → `DashboardComponent` (guarded)
- `/lesson/:id` → `LessonPlayerComponent` (guarded)
- `/vocabulary` → `VocabularyComponent` (guarded)
- `/progress` → `ProgressComponent` (guarded)
- `/chat` → `ChatComponent` (guarded)
- `**` → redirects to `/login`

**Step 2: Run complete test suite**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; npx ng test --watch=false 2>&1 | Select-Object -Last 10"
```
Expected: ALL specs pass, 0 failures.

**Step 3: Print git log summary**

```bash
powershell -Command "cd C:\Coding\einav-english-learn; git log --oneline"
```
Review the full commit history to ensure all phases are represented.

**Step 4: Commit**

```bash
powershell -Command "cd C:\Coding\einav-english-learn; git commit --allow-empty -m 'chore: Phase 9 complete — all routes wired, all tests green, prod build verified'"
```

---

## Phase 9 Done — Verify Checklist

- [ ] `app.spec.ts` fixed — 0 test failures in full suite
- [ ] `index.html` has title, viewport, description, theme-color, PWA meta tags
- [ ] `ng build --configuration=production` passes
- [ ] All 7 app routes wired in `app.routes.ts`
- [ ] Complete git log shows all 9 phases
- [ ] 4 commits made
