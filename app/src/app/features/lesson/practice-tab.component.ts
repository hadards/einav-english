import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Lesson, Exercise } from '@shared/lesson.schema';

type AnswerState = 'unanswered' | 'correct' | 'wrong_once' | 'wrong_twice';

interface ExerciseState {
  exercise: Exercise;
  state: AnswerState;
  userAnswer: string;
  showHint: boolean;
  showExplanation: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

@Component({
  selector: 'app-practice-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');

    :host { font-family: 'DM Sans', sans-serif; }

    .card-front {
      animation: cardIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .card-result {
      animation: cardIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .shake {
      animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
    }
    @keyframes shake {
      10%, 90% { transform: translateX(-3px); }
      20%, 80% { transform: translateX(5px); }
      30%, 50%, 70% { transform: translateX(-7px); }
      40%, 60% { transform: translateX(7px); }
    }

    .submit-btn {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(99,102,241,0.4);
    }
    .submit-btn:active { transform: translateY(0); }

    .mcq-btn {
      transition: all 0.2s ease;
      border: 2px solid #e0e7ff;
    }
    .mcq-btn:hover:not(:disabled) {
      border-color: #6366f1;
      background: #eef2ff;
      transform: translateX(4px);
    }
    .mcq-correct { border-color: #10b981 !important; background: #ecfdf5 !important; color: #065f46 !important; }
    .mcq-wrong   { border-color: #f43f5e !important; background: #fff1f2 !important; color: #9f1239 !important; }

    .word-chip {
      transition: all 0.15s ease;
    }
    .word-chip:hover { transform: scale(1.05); }
    .word-chip:active { transform: scale(0.97); }

    .explanation-drawer {
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .celebrate {
      animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    @keyframes pop {
      from { opacity: 0; transform: scale(0.5); }
      to   { opacity: 1; transform: scale(1); }
    }

    .next-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .next-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(16,185,129,0.35);
    }

    .focus-input:focus { outline: none; border-color: #6366f1 !important; }
    .focus-input::placeholder { color: #c4b5fd; font-style: italic; font-size: 14px; }
    textarea.focus-input::placeholder { color: #c4b5fd; font-style: italic; font-size: 14px; }
  `],
  template: `
    <div class="flex flex-col gap-5" style="font-family:'DM Sans',sans-serif">

      <!-- Progress bar -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs font-semibold" style="color:#6b7280">
            {{ answeredCount() }} <span style="color:#d1d5db">/</span> {{ totalCount() }}
          </span>
          <span class="text-sm font-bold" style="color:#6366f1;font-family:'Sora',sans-serif">{{ scoreDisplay() }}</span>
        </div>
        <div class="rounded-full overflow-hidden" style="height:6px;background:#e0e7ff">
          <div class="h-full rounded-full transition-all duration-500"
            style="background:linear-gradient(90deg,#6366f1,#8b5cf6)"
            [style.width]="progressPct() + '%'">
          </div>
        </div>
      </div>

      <!-- DONE SCREEN -->
      @if (done()) {
        <div class="flex flex-col items-center gap-4 py-8 text-center">
          <div class="celebrate text-6xl">{{ passMark() ? '🏆' : '💪' }}</div>
          <div>
            <p class="text-2xl font-black mb-1" style="font-family:'Sora',sans-serif;color:#1e1b4b">{{ scoreDisplay() }}</p>
            <p class="font-semibold text-gray-700 mb-1">{{ passMark() ? 'Practice complete!' : 'Keep going!' }}</p>
            <p class="text-sm text-gray-400">{{ passMark() ? 'Speaking practice is now unlocked 🎤' : 'You need 70% to unlock speaking.' }}</p>
          </div>
          @if (passMark()) {
            <button (click)="completed.emit(finalScore())" class="next-btn text-white px-10 py-4 rounded-2xl font-bold text-base min-h-[44px]"
              style="font-family:'Sora',sans-serif">
              Continue to Speak →
            </button>
          } @else {
            <button (click)="retry()" class="submit-btn text-white px-10 py-4 rounded-2xl font-bold text-base min-h-[44px]"
              style="font-family:'Sora',sans-serif">
              Try Again
            </button>
          }
        </div>
      }

      <!-- QUESTION CARD -->
      @if (!done() && currentItem()) {
        <div>
          <!-- FRONT: Question -->
          @if (!isFlipped()) {
            <div class="card-front rounded-2xl overflow-hidden shadow-md" [class.shake]="isShaking()" style="border:1.5px solid #e0e7ff">
              <div class="px-4 pt-3 pb-2 flex items-center justify-between" style="background:linear-gradient(135deg,#eef2ff,#f5f3ff)">
                <span class="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style="background:#6366f1;color:white">
                  {{ typeLabel(currentItem()!.exercise.type) }}
                </span>
                <span class="text-xs" style="color:#a5b4fc">{{ currentIndex() + 1 }} / {{ totalCount() }}</span>
              </div>

              <div class="px-5 py-5" style="background:white">
                <p class="font-semibold text-gray-900 leading-relaxed mb-5" style="font-size:15px">
                  {{ currentItem()!.exercise.question }}
                </p>

                <!-- Fill blank -->
                @if (currentItem()!.exercise.type === 'fill_blank') {
                  <input type="text" [(ngModel)]="userInput" (keydown.enter)="submit()"
                    placeholder="Type your answer..."
                    class="focus-input w-full rounded-xl px-4 py-3 text-base outline-none transition"
                    style="border:2px solid #e0e7ff;font-size:16px;font-family:'DM Sans',sans-serif" />
                }

                <!-- MCQ -->
                @if (currentItem()!.exercise.type === 'mcq') {
                  <div class="flex flex-col gap-2">
                    @for (opt of mcqOptions(); track opt) {
                      <button (click)="selectMcq(opt)" [disabled]="currentItem()!.state !== 'unanswered'"
                        class="mcq-btn w-full text-left px-4 py-3 rounded-xl text-sm font-medium min-h-[44px]"
                        [class.mcq-correct]="currentItem()!.state !== 'unanswered' && opt === currentItem()!.exercise.answer"
                        [class.mcq-wrong]="currentItem()!.state !== 'unanswered' && opt === currentItem()!.userAnswer && opt !== currentItem()!.exercise.answer"
                        style="background:white;color:#374151">
                        {{ opt }}
                      </button>
                    }
                  </div>
                }

                <!-- Error correction -->
                @if (currentItem()!.exercise.type === 'error_correction') {
                  <textarea [(ngModel)]="userInput" rows="3" placeholder="Fix the sentence..."
                    class="focus-input w-full rounded-xl px-4 py-3 text-base outline-none transition resize-none"
                    style="border:2px solid #e0e7ff;font-size:16px;font-family:'DM Sans',sans-serif">
                  </textarea>
                }

                <!-- Sentence builder -->
                @if (currentItem()!.exercise.type === 'sentence_builder') {
                  <div class="flex flex-col gap-3">
                    <div class="min-h-[52px] rounded-xl px-3 py-2 flex flex-wrap gap-2 items-center"
                      style="background:#f5f3ff;border:2px dashed #c4b5fd">
                      @if (builtSentence().length === 0) {
                        <span class="text-xs" style="color:#c4b5fd">Tap words to build the sentence...</span>
                      }
                      @for (word of builtSentence(); track $index; let i = $index) {
                        <button (click)="removeWord(i)" class="word-chip px-3 py-1.5 rounded-lg text-sm font-medium" style="background:#6366f1;color:white">
                          {{ word }} ×
                        </button>
                      }
                    </div>
                    <div class="flex flex-wrap gap-2">
                      @for (word of remainingWords(); track $index; let i = $index) {
                        <button (click)="addWord(word, i)" class="word-chip px-3 py-1.5 rounded-lg text-sm font-medium min-h-[36px]"
                          style="background:white;border:1.5px solid #e0e7ff;color:#374151">
                          {{ word }}
                        </button>
                      }
                    </div>
                  </div>
                }

                <!-- Hint -->
                @if (currentItem()!.showHint) {
                  <div class="explanation-drawer mt-4 rounded-xl px-4 py-3 flex items-start gap-2"
                    style="background:#fffbeb;border:1px solid #fde68a">
                    <span>💡</span>
                    <p class="text-sm" style="color:#92400e">{{ currentItem()!.exercise.hint }}</p>
                  </div>
                }

                <!-- Submit -->
                @if (currentItem()!.exercise.type !== 'mcq') {
                  <button (click)="submit()" class="submit-btn w-full text-white rounded-xl py-3.5 font-bold mt-4 min-h-[44px]"
                    style="font-family:'Sora',sans-serif">
                    {{ currentItem()!.state === 'wrong_twice' ? 'See answer →' : 'Check' }}
                  </button>
                }
              </div>
            </div>
          }

          <!-- RESULT: shown after flip -->
          @if (isFlipped()) {
            <div class="card-result rounded-2xl overflow-hidden shadow-md"
              [style.border]="currentItem()!.state === 'correct' ? '2px solid #10b981' : '2px solid #f43f5e'">

              <div class="px-4 pt-3 pb-2 flex items-center gap-2"
                [style.background]="currentItem()!.state === 'correct' ? 'linear-gradient(135deg,#ecfdf5,#f0fdf4)' : 'linear-gradient(135deg,#fff1f2,#fff5f5)'">
                <span class="text-lg">{{ currentItem()!.state === 'correct' ? '✅' : '❌' }}</span>
                <span class="text-sm font-bold" [style.color]="currentItem()!.state === 'correct' ? '#059669' : '#e11d48'">
                  {{ currentItem()!.state === 'correct' ? 'Correct!' : 'Not quite' }}
                </span>
              </div>

              <div class="px-5 py-5 flex flex-col gap-4" style="background:white">
                <div class="rounded-xl px-4 py-3" style="background:#f5f3ff">
                  <p class="text-xs font-semibold uppercase tracking-widest mb-1" style="color:#6366f1">Correct Answer</p>
                  <p class="font-semibold text-gray-900">{{ currentItem()!.exercise.answer }}</p>
                </div>

                @if (currentItem()!.exercise.explanation) {
                  <div class="explanation-drawer rounded-xl px-4 py-3" style="background:#eff6ff;border:1px solid #bfdbfe">
                    <p class="text-sm text-gray-700">{{ currentItem()!.exercise.explanation }}</p>
                    @if (currentItem()!.exercise.hebrew_note) {
                      <p class="text-sm mt-2" style="color:#d97706">🇮🇱 {{ currentItem()!.exercise.hebrew_note }}</p>
                    }
                  </div>
                }

                <button (click)="next()" class="next-btn w-full text-white rounded-xl py-3.5 font-bold min-h-[44px]"
                  style="font-family:'Sora',sans-serif">
                  Next →
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PracticeTabComponent implements OnInit {
  @Input({ required: true }) lesson!: Lesson;
  @Output() completed = new EventEmitter<number>();

  readonly queue = signal<ExerciseState[]>([]);
  readonly currentIndex = signal(0);
  readonly flipped = signal(false);
  readonly shaking = signal(false);

  userInput = '';
  private readonly mcqShuffled = signal<string[]>([]);
  readonly builtSentence = signal<string[]>([]);
  readonly remainingWords = signal<string[]>([]);

  ngOnInit() {
    this.queue.set(shuffle(this.lesson.exercises).map(e => ({
      exercise: e, state: 'unanswered' as AnswerState,
      userAnswer: '', showHint: false, showExplanation: false,
    })));
    this.initCurrentExercise();
  }

  readonly currentItem = computed(() => this.queue()[this.currentIndex()] ?? null);
  readonly totalCount = computed(() => this.lesson.exercises.length);
  readonly answeredCount = computed(() => this.queue().slice(0, this.currentIndex()).filter(e => e.state !== 'unanswered').length);
  readonly progressPct = computed(() => Math.round((this.currentIndex() / Math.max(this.totalCount(), 1)) * 100));
  readonly isFlipped = computed(() => this.flipped());
  readonly isShaking = computed(() => this.shaking());

  readonly finalScore = computed(() => {
    const answered = this.queue().filter(e => e.state !== 'unanswered');
    const correct = answered.filter(e => e.state === 'correct').length;
    return answered.length ? correct / answered.length : 0;
  });

  readonly scoreDisplay = computed(() => `${Math.round(this.finalScore() * 100)}%`);
  readonly passMark = computed(() => this.finalScore() >= 0.7);
  readonly done = computed(() => {
    const q = this.queue();
    return q.length > 0 && this.currentIndex() >= q.length;
  });

  readonly mcqOptions = computed(() => this.mcqShuffled());

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      fill_blank: 'Fill in',
      mcq: 'Choose',
      error_correction: 'Fix it',
      sentence_builder: 'Build it',
    };
    return map[type] ?? type;
  }

  private initCurrentExercise() {
    const item = this.currentItem();
    if (!item) return;
    this.userInput = '';
    this.flipped.set(false);
    if (item.exercise.type === 'mcq') {
      this.mcqShuffled.set(shuffle([item.exercise.answer, ...(item.exercise.distractors ?? [])]));
    }
    if (item.exercise.type === 'sentence_builder') {
      this.builtSentence.set([]);
      this.remainingWords.set(shuffle(item.exercise.words ?? []));
    }
    // error_correction: start empty, user types the corrected sentence
  }

  addWord(word: string, idx: number) {
    const rem = [...this.remainingWords()];
    rem.splice(idx, 1);
    this.remainingWords.set(rem);
    this.builtSentence.update(s => [...s, word]);
  }

  removeWord(idx: number) {
    const built = [...this.builtSentence()];
    const word = built.splice(idx, 1)[0];
    this.builtSentence.set(built);
    this.remainingWords.update(r => [...r, word]);
  }

  selectMcq(option: string) {
    const item = this.currentItem();
    if (!item || item.state !== 'unanswered') return;
    this.queue.update(q => {
      const updated = [...q];
      updated[this.currentIndex()] = { ...updated[this.currentIndex()], userAnswer: option };
      return updated;
    });
    this.userInput = option;
    this.submitEval(option);
  }

  submit() {
    const item = this.currentItem();
    if (!item) return;
    if (item.state === 'wrong_twice') {
      this.flipCard();
      return;
    }
    const answer = item.exercise.type === 'sentence_builder'
      ? this.builtSentence().join(' ')
      : this.userInput.trim();
    this.submitEval(answer);
  }

  private submitEval(answer: string) {
    const item = this.currentItem();
    if (!item) return;
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s']/g, '').replace(/\s+/g, ' ').trim();
    const correct = normalize(answer) === normalize(item.exercise.answer);

    this.queue.update(q => {
      const updated = [...q];
      const cur = { ...updated[this.currentIndex()] };
      if (correct) {
        cur.state = 'correct';
      } else if (cur.state === 'unanswered') {
        cur.state = 'wrong_once';
        cur.showHint = true;
      } else {
        cur.state = 'wrong_twice';
      }
      updated[this.currentIndex()] = cur;
      return updated;
    });

    if (correct) {
      setTimeout(() => this.flipCard(), 300);
    } else if (this.currentItem()?.state === 'wrong_twice') {
      this.triggerShake();
    }
  }

  private flipCard() {
    this.flipped.set(true);
  }

  private triggerShake() {
    this.flipped.set(true);
    this.shaking.set(true);
    setTimeout(() => this.shaking.set(false), 450);
  }

  retry() {
    const shuffled = shuffle(this.lesson.exercises);
    this.queue.set(shuffled.map(e => ({
      exercise: e, state: 'unanswered' as AnswerState,
      userAnswer: '', showHint: false, showExplanation: false,
    })));
    this.currentIndex.set(0);
    this.flipped.set(false);
    this.initCurrentExercise();
  }

  next() {
    const item = this.currentItem();
    if (item?.state === 'wrong_once') {
      this.queue.update(q => [...q, { ...item, state: 'unanswered', showHint: false, userAnswer: '' }]);
    }
    this.currentIndex.update(i => i + 1);
    this.flipped.set(false);
    setTimeout(() => this.initCurrentExercise(), 60);
  }
}
