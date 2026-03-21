import { Component, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
    const el = this.messagesEl?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  send() {
    const text = this.inputText.trim();
    if (!text || this.streaming()) return;

    this.inputText = '';
    this.messages.update(msgs => [...msgs, { role: 'user', content: text }]);
    this.messages.update(msgs => [...msgs, { role: 'assistant', content: '' }]);
    this.streaming.set(true);

    const history = this.messages()
      .slice(0, -1)
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

  appendToLast(text: string) {
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
