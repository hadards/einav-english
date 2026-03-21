import { Component, Input, Output, EventEmitter, signal, computed, OnDestroy, OnInit } from '@angular/core';
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
export class SpeakTabComponent implements OnInit, OnDestroy {
  @Input({ required: true }) lesson!: Lesson;
  @Output() completed = new EventEmitter<number>();

  readonly speechSupported: boolean =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

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

  handleTranscript(transcript: string) {
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
