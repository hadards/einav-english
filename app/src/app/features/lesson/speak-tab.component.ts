import { Component, Input, Output, EventEmitter, signal, computed, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Lesson, SpeakSentence } from '@shared/lesson.schema';

type SentenceState = 'waiting' | 'recording' | 'passed' | 'failed' | 'skipped';

interface SentenceResult {
  sentence: SpeakSentence;
  state: SentenceState;
  transcript: string;
  score: number;
}

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
  imports: [CommonModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');

    :host { font-family: 'DM Sans', sans-serif; }

    .mic-btn {
      position: relative;
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
      box-shadow: 0 8px 24px rgba(99,102,241,0.4);
    }
    .mic-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 12px 32px rgba(99,102,241,0.5);
    }
    .mic-btn:active { transform: scale(0.96); }

    .mic-btn.recording {
      background: linear-gradient(135deg, #f43f5e, #e11d48);
      box-shadow: 0 8px 24px rgba(244,63,94,0.5);
      animation: glow-pulse 1.2s ease-in-out infinite;
    }
    @keyframes glow-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(244,63,94,0.5), 0 8px 24px rgba(244,63,94,0.4); }
      50% { box-shadow: 0 0 0 16px rgba(244,63,94,0), 0 8px 24px rgba(244,63,94,0.5); }
    }

    .mic-ring {
      position: absolute;
      border-radius: 50%;
      border: 2px solid rgba(244,63,94,0.4);
      animation: ring-expand 1.2s ease-out infinite;
    }
    .mic-ring:nth-child(2) { animation-delay: 0.4s; }
    .mic-ring:nth-child(3) { animation-delay: 0.8s; }
    @keyframes ring-expand {
      from { width: 88px; height: 88px; opacity: 0.8; }
      to   { width: 148px; height: 148px; opacity: 0; }
    }

    .sentence-card {
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .result-badge {
      animation: pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    @keyframes pop {
      from { opacity: 0; transform: scale(0.6); }
      to   { opacity: 1; transform: scale(1); }
    }

    .celebrate { animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

    .finish-btn {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .finish-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(99,102,241,0.4);
    }

    .skip-btn { transition: color 0.15s; }
    .skip-btn:hover { color: #6b7280; }

    .play-btn {
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      background: linear-gradient(135deg, #f59e0b, #d97706);
    }
    .play-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(245,158,11,0.4); }
    .play-btn.speaking { background: linear-gradient(135deg, #6366f1, #8b5cf6); }

    .next-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .next-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(16,185,129,0.35);
    }
  `],
  template: `
    <div class="flex flex-col gap-5" style="font-family:'DM Sans',sans-serif">

      @if (!speechSupported) {
        <div class="rounded-2xl p-5" style="background:#fffbeb;border:1.5px solid #fde68a">
          <p class="font-bold mb-1" style="color:#92400e">Speech recognition not available</p>
          <p class="text-sm" style="color:#b45309">Try Chrome on desktop or Android.</p>
        </div>
      } @else if (allDone()) {

        <!-- Completion -->
        <div class="flex flex-col items-center gap-5 py-8 text-center">
          <div class="celebrate text-6xl">{{ passedCount() === results().length ? '🎉' : '🎤' }}</div>
          <div>
            <p class="text-3xl font-black mb-1" style="font-family:'Sora',sans-serif;color:#1e1b4b">
              {{ passedCount() }}<span style="color:#c4b5fd">/</span>{{ results().length }}
            </p>
            <p class="font-semibold text-gray-700 mb-1">
              {{ passedCount() === results().length ? 'Perfect speaking!' : 'Speaking practice done!' }}
            </p>
            <p class="text-sm text-gray-400">You passed {{ passedCount() }} of {{ results().length }} sentences.</p>
          </div>
          <button (click)="completed.emit(passedCount() / results().length)"
            class="finish-btn text-white px-10 py-4 rounded-2xl font-bold text-base min-h-[44px]"
            style="font-family:'Sora',sans-serif">
            Finish Lesson →
          </button>
        </div>

      } @else {

        <!-- Progress -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-semibold" style="color:#6b7280">
              Sentence {{ currentIndex() + 1 }} <span style="color:#d1d5db">/</span> {{ results().length }}
            </span>
            <span class="text-sm font-bold" style="color:#10b981;font-family:'Sora',sans-serif">
              {{ passedCount() }} passed
            </span>
          </div>
          <div class="rounded-full overflow-hidden" style="height:6px;background:#e0e7ff">
            <div class="h-full rounded-full transition-all duration-500"
              style="background:linear-gradient(90deg,#6366f1,#8b5cf6)"
              [style.width]="progressPct() + '%'">
            </div>
          </div>
        </div>

        @if (current()) {
          <div class="sentence-card flex flex-col gap-4">

            <!-- Sentence card -->
            <div class="rounded-2xl overflow-hidden shadow-sm" style="border:1.5px solid #e0e7ff">
              <div class="px-5 pt-4 pb-2" style="background:linear-gradient(135deg,#eef2ff,#f5f3ff)">
                <p class="text-xs font-bold uppercase tracking-widest mb-1" style="color:#6366f1">Say this sentence</p>
              </div>
              <div class="px-5 py-4" style="background:white">
                <p class="text-xl font-bold leading-relaxed mb-2" style="color:#1e1b4b;font-family:'Sora',sans-serif">
                  {{ current()!.sentence.sentence }}
                </p>
                @if (current()!.sentence.phonetic_hints) {
                  <p class="text-sm italic" style="color:#a5b4fc">{{ current()!.sentence.phonetic_hints }}</p>
                }
              </div>
            </div>

            <!-- Transcript -->
            @if (current()!.transcript) {
              <div class="result-badge rounded-2xl px-4 py-3" style="background:#f8fafc;border:1.5px solid #e2e8f0">
                <p class="text-xs font-semibold uppercase tracking-widest mb-1" style="color:#94a3b8">You said</p>
                <p class="text-gray-700 text-sm">{{ current()!.transcript }}</p>
              </div>
            }

            <!-- Result feedback -->
            @if (current()!.state === 'passed') {
              <div class="result-badge rounded-2xl px-4 py-3 flex items-center gap-3" style="background:#ecfdf5;border:1.5px solid #a7f3d0">
                <span class="text-2xl">✅</span>
                <div>
                  <p class="font-bold" style="color:#065f46">Great pronunciation!</p>
                  <p class="text-sm" style="color:#059669">Score: {{ pct(current()!.score) }}%</p>
                </div>
              </div>
            } @else if (current()!.state === 'failed') {
              <div class="result-badge rounded-2xl px-4 py-3" style="background:#fff1f2;border:1.5px solid #fecdd3">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-2xl">🎯</span>
                  <div>
                    <p class="font-bold" style="color:#9f1239">Keep trying!</p>
                    <p class="text-sm" style="color:#e11d48">Score: {{ pct(current()!.score) }}% — need {{ pct(current()!.sentence.pass_threshold) }}%</p>
                  </div>
                </div>
                <button (click)="playSentence()" [class.speaking]="isSpeaking()"
                  class="play-btn w-full text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 min-h-[40px]">
                  <span>{{ isSpeaking() ? '🔊 Playing...' : '🔊 Hear correct pronunciation' }}</span>
                </button>
              </div>
            }

            <!-- Mic area -->
            <div class="flex flex-col items-center gap-4 py-2">

              @if (current()!.state === 'waiting' || current()!.state === 'failed') {
                <div class="relative flex items-center justify-center" style="width:148px;height:148px">
                  <button (click)="startRecording()" class="mic-btn">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
                      <line x1="12" y1="19" x2="12" y2="23" stroke="white" stroke-width="2" stroke-linecap="round"/>
                      <line x1="8" y1="23" x2="16" y2="23" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>
                <p class="text-sm text-center" style="color:#94a3b8">
                  {{ current()!.state === 'failed' ? 'Try again — tap to record' : 'Tap to start recording' }}
                </p>
              }

              @if (current()!.state === 'recording') {
                <div class="relative flex items-center justify-center" style="width:148px;height:148px">
                  <div class="mic-ring"></div>
                  <div class="mic-ring"></div>
                  <div class="mic-ring"></div>
                  <button (click)="stopRecording()" class="mic-btn recording">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <rect x="6" y="6" width="12" height="12" rx="2"/>
                    </svg>
                  </button>
                </div>
                <p class="text-sm font-semibold text-center" style="color:#f43f5e">
                  Listening... speak now
                </p>
              }

              @if (current()!.state === 'passed') {
                <button (click)="advance()" class="next-btn text-white px-10 py-3.5 rounded-2xl font-bold min-h-[44px]"
                  style="font-family:'Sora',sans-serif">
                  Next →
                </button>
              }

              @if (current()!.state !== 'recording' && current()!.state !== 'passed') {
                <button (click)="skip()" class="skip-btn text-sm min-h-[44px]" style="color:#cbd5e1">
                  Skip this sentence
                </button>
              }
            </div>

          </div>
        }
      }
    </div>
  `,
})
export class SpeakTabComponent implements OnInit, OnDestroy {
  @Input({ required: true }) lesson!: Lesson;
  @Output() completed = new EventEmitter<number>();

  readonly speechSupported: boolean =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  readonly results = signal<SentenceResult[]>([]);
  readonly currentIndex = signal(0);
  readonly isSpeaking = signal(false);

  private recognition: any = null;
  private autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.results.set(
      this.lesson.speak.map(s => ({
        sentence: s, state: 'waiting' as SentenceState,
        transcript: '', score: 0,
      }))
    );
  }

  readonly current = computed(() => this.results()[this.currentIndex()] ?? null);
  readonly allDone = computed(() => {
    const r = this.results();
    return r.length > 0 && this.currentIndex() >= r.length;
  });
  readonly passedCount = computed(() => this.results().filter(r => r.state === 'passed').length);
  readonly progressPct = computed(() => {
    const total = this.results().length;
    return total ? Math.round((this.currentIndex() / total) * 100) : 0;
  });

  pct(v: number): number { return Math.round(v * 100); }

  playSentence() {
    const cur = this.current();
    if (!cur || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const text = cur.sentence.sentence;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 0.85;
    utt.onstart = () => this.isSpeaking.set(true);
    utt.onend = () => this.isSpeaking.set(false);
    utt.onerror = () => this.isSpeaking.set(false);
    window.speechSynthesis.speak(utt);
  }

  startRecording() {
    if (!this.speechSupported) return;
    this.recognition?.stop();
    this.recognition = null;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    this.recognition = rec;

    this.updateCurrent(r => ({ ...r, state: 'recording', transcript: '' }));

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.handleTranscript(transcript);
    };
    rec.onerror = (event: any) => {
      const errorType: string = event?.error ?? 'unknown';
      const message = errorType === 'not-allowed'
        ? 'Microphone access denied — allow microphone and try again.'
        : `Recognition error: ${errorType}`;
      this.updateCurrent(r => ({ ...r, state: 'failed', transcript: message, score: 0 }));
    };
    rec.onend = () => {
      if (this.recognition !== rec) return;
      this.recognition = null;
      const cur = this.current();
      if (cur?.state === 'recording') {
        this.updateCurrent(r => ({ ...r, state: 'failed', transcript: '', score: 0 }));
      }
    };
    rec.start();
  }

  stopRecording() { this.recognition?.stop(); }

  handleTranscript(transcript: string) {
    const cur = this.current();
    if (!cur) return;
    const score = similarity(transcript, cur.sentence.sentence);
    const passed = score >= cur.sentence.pass_threshold;
    this.updateCurrent(r => ({ ...r, transcript, score, state: passed ? 'passed' : 'failed' }));
    if (passed) {
      this.autoAdvanceTimer = setTimeout(() => {
        this.autoAdvanceTimer = null;
        this.advance();
      }, 1400);
    }
  }

  advance() {
    if (this.autoAdvanceTimer !== null) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
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
    if (this.autoAdvanceTimer !== null) clearTimeout(this.autoAdvanceTimer);
    window.speechSynthesis?.cancel();
  }
}
