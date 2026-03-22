# Phase 7 — AI Chat Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an AI conversation partner — a `/chat` route with a simple chat UI that streams responses from a Vercel serverless function (`/api/chat`) which calls the Anthropic Claude API. The AI acts as an English tutor, guiding Einav (a Hebrew-speaking A2→B2 learner) through conversation practice.

**Architecture:** `ChatComponent` at `/chat` manages message history in a signal array, sends user messages to `/api/chat` via `HttpClient.post()` (streaming via `text/event-stream` SSE), and appends token chunks to the last assistant message as they arrive. The Vercel serverless function at `api/chat.ts` receives `{ messages: [{role, content}] }`, prepends a system prompt, and proxies to the Anthropic Claude API using the `@anthropic-ai/sdk` Node.js SDK. The API key is stored in a Vercel environment variable `ANTHROPIC_API_KEY` — never in client code.

**Tech Stack:** Angular 20 standalone components, signals, `HttpClient`, Vercel serverless function (`api/chat.ts`), `@anthropic-ai/sdk` (Node.js), Tailwind CSS v3. The streaming uses `fetch` with `ReadableStream` on the client (no RxJS streaming) because `HttpClient` doesn't support SSE natively.

---

### Task 1: Create Vercel serverless chat endpoint

**Files:**
- Create: `api/chat.ts`

**Step 1: Install Anthropic SDK**

From `C:\Coding\einav-english-learn`:
```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; npm install @anthropic-ai/sdk 2>&1 | Select-Object -Last 5"
```

Wait — `api/chat.ts` runs as a Node.js serverless function, not inside the Angular app. The SDK needs to be installed at the repo root level (or the function will need its own `package.json`). Since Vercel auto-installs from a root `package.json`, create `package.json` at the repo root:

Check if `C:\Coding\einav-english-learn\package.json` exists first. If not, create it:

```json
{
  "name": "einav-english-learn",
  "private": true,
  "dependencies": {
    "@anthropic-ai/sdk": "^0.40.0"
  }
}
```

Then install:
```bash
powershell -Command "cd C:\Coding\einav-english-learn; npm install 2>&1 | Select-Object -Last 5"
```

**Step 2: Create `api/chat.ts`**

Create `C:\Coding\einav-english-learn\api\chat.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are an encouraging English tutor for Einav, a Hebrew-speaking adult learner at A2–B2 level.

Your role:
- Respond in simple, clear English appropriate for the learner's current level
- Gently correct grammar mistakes by acknowledging the message and showing the correct form naturally
- Ask follow-up questions to keep the conversation going
- Occasionally highlight useful vocabulary or phrases
- Keep responses concise (2–4 sentences) unless explaining a grammar point
- Be warm, patient, and encouraging

Do NOT:
- Use Hebrew unless asked
- Overwhelm with multiple corrections at once
- Be condescending`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: Message[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const { messages } = req.body as RequestBody;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const client = new Anthropic({ apiKey });

  // Stream the response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message ?? 'Unknown error' })}\n\n`);
    res.end();
  }
}
```

**Step 3: Build Angular app (verify no regressions)**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; ng build --configuration=development 2>&1 | Select-Object -Last 6"
```
Expected: succeeds.

**Step 4: Commit**

```bash
powershell -Command "cd C:\Coding\einav-english-learn; git add api/chat.ts package.json package-lock.json; git commit -m 'feat: add /api/chat Vercel serverless endpoint (Anthropic streaming)'"
```

---

### Task 2: Create `ChatComponent`

**Files:**
- Create: `app/src/app/features/chat/chat.component.ts`
- Modify: `app/src/app/app.routes.ts`

**Step 1: Create `chat.component.ts`**

Create directory `app/src/app/features/chat/` then create `C:\Coding\einav-english-learn\app\src\app\features\chat\chat.component.ts`:

```typescript
import { Component, inject, signal, computed, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">

      <!-- Header -->
      <header class="bg-white border-b border-gray-200 px-4 py-4 lg:px-8 flex-shrink-0">
        <div class="max-w-2xl mx-auto flex items-center gap-3">
          <a routerLink="/dashboard" class="text-blue-600 text-sm">← Dashboard</a>
          <h1 class="text-xl font-bold text-gray-900 mx-auto">AI Tutor</h1>
        </div>
      </header>

      <!-- Messages -->
      <div #messagesEl class="flex-1 overflow-y-auto px-4 py-4">
        <div class="max-w-2xl mx-auto flex flex-col gap-4">

          @if (messages().length === 0) {
            <div class="text-center text-gray-400 py-12">
              <p class="text-lg font-medium mb-2">👋 Hi! I'm your AI English tutor.</p>
              <p class="text-sm">Start chatting to practice your English. I'll help you improve naturally.</p>
            </div>
          }

          @for (msg of messages(); track $index) {
            <div [class]="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
              <div
                [class]="msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]'"
                class="text-sm leading-relaxed"
              >
                {{ msg.content }}
                @if (msg.role === 'assistant' && streaming() && $last) {
                  <span class="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle"></span>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Input -->
      <div class="bg-white border-t border-gray-200 px-4 py-4 flex-shrink-0">
        <div class="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            [(ngModel)]="inputText"
            (keydown.enter)="send()"
            [disabled]="streaming()"
            placeholder="{{ streaming() ? 'Waiting for response...' : 'Type a message...' }}"
            class="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400 min-h-[44px]"
            style="font-size: 16px"
          />
          <button
            (click)="send()"
            [disabled]="!inputText.trim() || streaming()"
            class="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-40 min-h-[44px]"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('messagesEl') private messagesEl!: ElementRef<HTMLDivElement>;

  readonly messages = signal<ChatMessage[]>([]);
  readonly streaming = signal(false);
  inputText = '';

  ngAfterViewChecked() {
    // Auto-scroll to bottom when messages update
    const el = this.messagesEl?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  send() {
    const text = this.inputText.trim();
    if (!text || this.streaming()) return;

    this.inputText = '';
    this.messages.update(msgs => [...msgs, { role: 'user', content: text }]);

    // Add empty assistant message that will be filled by streaming
    this.messages.update(msgs => [...msgs, { role: 'assistant', content: '' }]);
    this.streaming.set(true);

    const history = this.messages()
      .slice(0, -1) // exclude the empty assistant placeholder
      .map(m => ({ role: m.role, content: m.content }));

    this.streamChat(history);
  }

  private async streamChat(messages: ChatMessage[]) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok || !response.body) {
        this.appendToLast('(Error: could not connect to tutor)');
        this.streaming.set(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            this.streaming.set(false);
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              this.appendToLast(parsed.text);
            } else if (parsed.error) {
              this.appendToLast(`(Error: ${parsed.error})`);
              this.streaming.set(false);
              return;
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }
    } catch {
      this.appendToLast('(Error: network failure)');
    } finally {
      this.streaming.set(false);
    }
  }

  private appendToLast(text: string) {
    this.messages.update(msgs => {
      const updated = [...msgs];
      const last = updated[updated.length - 1];
      if (last?.role === 'assistant') {
        updated[updated.length - 1] = { ...last, content: last.content + text };
      }
      return updated;
    });
  }
}
```

**Step 2: Update `app.routes.ts`**

Read `C:\Coding\einav-english-learn\app\src\app\app.routes.ts`.

Add a chat route before the `**` wildcard:
```typescript
  {
    path: 'chat',
    loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [authGuard],
  },
```

**Step 3: Add Chat link to dashboard bottom nav**

Read `C:\Coding\einav-english-learn\app\src\app\features\dashboard\dashboard.component.ts`.

In the mobile bottom nav (inside `<nav class="fixed bottom-0...">`) add a Chat nav item after the Vocab item:

```html
        <a routerLink="/chat" class="flex-1 flex flex-col items-center py-3 text-gray-400 min-h-[44px]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          <span class="text-xs mt-0.5">Chat</span>
        </a>
```

**Step 4: Build**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; ng build --configuration=development 2>&1 | Select-Object -Last 6"
```
Expected: succeeds.

**Step 5: Commit**

```bash
powershell -Command "cd C:\Coding\einav-english-learn; git add app/src/app/features/chat/ app/src/app/app.routes.ts app/src/app/features/dashboard/dashboard.component.ts; git commit -m 'feat: Phase 7 AI chat — ChatComponent with SSE streaming + dashboard nav link'"
```

---

### Task 3: Write `ChatComponent` tests

**Files:**
- Create: `app/src/app/features/chat/chat.component.spec.ts`

**Step 1: Create spec file**

Create `C:\Coding\einav-english-learn\app\src\app\features\chat\chat.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
  let fixture: ComponentFixture<ChatComponent>;
  let component: ChatComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty messages', () => {
    expect(component.messages().length).toBe(0);
  });

  it('should not be streaming initially', () => {
    expect(component.streaming()).toBeFalse();
  });

  it('send() should not add message when inputText is empty', () => {
    component.inputText = '';
    component.send();
    expect(component.messages().length).toBe(0);
  });

  it('send() should add user message and empty assistant message', () => {
    // Mock fetch to avoid real network call
    (window as any).fetch = () => Promise.resolve({ ok: false, body: null });

    component.inputText = 'Hello!';
    component.send();

    const msgs = component.messages();
    expect(msgs.length).toBe(2);
    expect(msgs[0].role).toBe('user');
    expect(msgs[0].content).toBe('Hello!');
    expect(msgs[1].role).toBe('assistant');
  });

  it('send() should clear inputText after sending', () => {
    (window as any).fetch = () => Promise.resolve({ ok: false, body: null });
    component.inputText = 'Hi';
    component.send();
    expect(component.inputText).toBe('');
  });

  it('appendToLast() should append text to last assistant message', () => {
    component.messages.set([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
    ]);
    (component as any).appendToLast(' there!');
    expect(component.messages()[1].content).toBe('Hi there!');
  });
});
```

**Step 2: Run tests**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; npx ng test --watch=false --include='**/chat.component.spec.ts' 2>&1 | Select-Object -Last 10"
```
Expected: `6 specs, 0 failures`

**Step 3: Run all tests**

```bash
powershell -Command "cd C:\Coding\einav-english-learn\app; npx ng test --watch=false 2>&1 | Select-Object -Last 6"
```

**Step 4: Commit**

```bash
powershell -Command "cd C:\Coding\einav-english-learn; git add app/src/app/features/chat/chat.component.spec.ts; git commit -m 'test: add ChatComponent unit tests'"
```

---

## Phase 7 Done — Verify Checklist

- [ ] `api/chat.ts` Vercel serverless function created
- [ ] System prompt defines AI as English tutor for Hebrew-speaking learner
- [ ] API key read from `process.env['ANTHROPIC_API_KEY']` (never in client code)
- [ ] SSE streaming via `text/event-stream` response
- [ ] `ChatComponent` at `/chat` with message history (user right, assistant left)
- [ ] Cursor blink indicator while streaming
- [ ] Input disabled while streaming
- [ ] Auto-scroll to bottom on new messages
- [ ] Empty state with welcome message
- [ ] Chat nav item added to dashboard mobile bottom nav
- [ ] `ng build --configuration=development` passes
- [ ] 6 chat component tests pass
- [ ] 3 commits made (api endpoint, component, tests)
