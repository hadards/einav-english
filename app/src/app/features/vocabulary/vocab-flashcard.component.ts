import { Component, Input, Output, EventEmitter, signal, computed, OnInit, OnDestroy } from '@angular/core';
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
            <div class="flex items-center gap-2">
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ current()!.word.word }}</p>
                <p class="text-sm text-gray-400 italic capitalize">{{ current()!.word.part_of_speech }}</p>
              </div>
              <button
                (click)="$event.stopPropagation(); speak(current()!.word.word)"
                class="flex items-center justify-center rounded-full min-w-[36px] min-h-[36px]"
                style="background:#eef2ff;color:#6366f1;font-size:18px;border:none;cursor:pointer"
                title="Hear pronunciation"
              >🔊</button>
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
export class VocabFlashcardComponent implements OnInit, OnDestroy {
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

  speak(word: string) {
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = 'en-US';
    utt.rate = 0.85;
    speechSynthesis.speak(utt);
  }

  ngOnDestroy() {
    speechSynthesis.cancel();
  }

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
