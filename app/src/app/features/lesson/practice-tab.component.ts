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
  template: `
    <div class="flex flex-col gap-6">
      <div>
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>{{ answeredCount() }} / {{ queue().length }} answered</span>
          <span class="font-medium text-blue-600">{{ scoreDisplay() }}</span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-blue-500 rounded-full transition-all" [style.width]="progressPct() + '%'"></div>
        </div>
      </div>

      @if (done()) {
        <div class="text-center py-10">
          <p class="text-4xl mb-3">{{ scoreDisplay() }} {{ passMark() ? '🎉' : '💪' }}</p>
          <p class="text-lg font-semibold text-gray-800 mb-1">{{ passMark() ? 'Practice complete!' : 'Keep going!' }}</p>
          <p class="text-sm text-gray-500 mb-6">{{ passMark() ? 'Speak tab is now unlocked.' : 'You need 70% to unlock speaking practice.' }}</p>
          <button (click)="completed.emit(finalScore())" class="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition min-h-[44px]">
            {{ passMark() ? 'Continue to Speak →' : 'Retry' }}
          </button>
        </div>
      } @else if (currentItem()) {
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">{{ currentItem()!.exercise.type }}</span>
          </div>

          <p class="text-gray-800 font-medium leading-relaxed">{{ currentItem()!.exercise.question }}</p>

          @if (currentItem()!.exercise.type === 'fill_blank') {
            <input type="text" [(ngModel)]="userInput" (keydown.enter)="submit()" placeholder="Type your answer..."
              class="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]" style="font-size:16px" />
          }

          @if (currentItem()!.exercise.type === 'mcq') {
            <div class="flex flex-col gap-2">
              @for (opt of mcqOptions(); track opt) {
                <button (click)="selectMcq(opt)" [class]="mcqOptionClass(opt)" class="w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition min-h-[44px]">{{ opt }}</button>
              }
            </div>
          }

          @if (currentItem()!.exercise.type === 'error_correction') {
            <textarea [(ngModel)]="userInput" rows="3" placeholder="Fix the sentence..."
              class="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" style="font-size:16px"></textarea>
          }

          @if (currentItem()!.exercise.type === 'sentence_builder') {
            <div class="flex flex-col gap-3">
              <div class="min-h-[48px] bg-gray-50 border border-dashed border-gray-300 rounded-lg px-3 py-2 flex flex-wrap gap-2">
                @for (word of builtSentence(); track $index) {
                  <button (click)="removeWord($index)" class="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition">{{ word }} ×</button>
                }
              </div>
              <div class="flex flex-wrap gap-2">
                @for (word of remainingWords(); track $index) {
                  <button (click)="addWord(word, $index)" class="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm hover:border-blue-400 transition min-h-[36px]">{{ word }}</button>
                }
              </div>
            </div>
          }

          @if (currentItem()!.showHint) {
            <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">💡 Hint: {{ currentItem()!.exercise.hint }}</div>
          }
          @if (currentItem()!.showExplanation) {
            <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
              {{ currentItem()!.exercise.explanation }}
              @if (currentItem()!.exercise.hebrew_note) {
                <p class="mt-2 text-amber-700">🇮🇱 {{ currentItem()!.exercise.hebrew_note }}</p>
              }
            </div>
          }

          @if (currentItem()!.exercise.type !== 'mcq') {
            <button (click)="submit()" class="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition min-h-[44px]">
              {{ currentItem()!.state === 'wrong_twice' ? 'Next →' : 'Check' }}
            </button>
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

  userInput = '';
  private mcqShuffled: string[] = [];
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

  readonly answeredCount = computed(() => this.queue().filter(e => e.state !== 'unanswered').length);

  readonly progressPct = computed(() => {
    const total = this.queue().length;
    return total ? Math.round((this.answeredCount() / total) * 100) : 0;
  });

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

  readonly mcqOptions = computed(() => this.mcqShuffled);

  mcqOptionClass(opt: string): string {
    const item = this.currentItem();
    if (!item) return 'border-gray-200 bg-white';
    if (item.state !== 'unanswered' && opt === item.exercise.answer) return 'border-green-400 bg-green-50 text-green-800';
    if (item.state !== 'unanswered' && opt === item.userAnswer && opt !== item.exercise.answer) return 'border-red-300 bg-red-50 text-red-700';
    return 'border-gray-200 bg-white hover:border-blue-300';
  }

  private initCurrentExercise() {
    const item = this.currentItem();
    if (!item) return;
    this.userInput = '';
    if (item.exercise.type === 'mcq') {
      this.mcqShuffled = shuffle([item.exercise.answer, ...(item.exercise.distractors ?? [])]);
    }
    if (item.exercise.type === 'sentence_builder') {
      this.builtSentence.set([]);
      this.remainingWords.set(shuffle(item.exercise.words ?? []));
    }
    if (item.exercise.type === 'error_correction') {
      this.userInput = item.exercise.question;
    }
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
    this.submit();
  }

  submit() {
    const item = this.currentItem();
    if (!item) return;
    if (item.state === 'wrong_twice') { this.next(); return; }

    const answer = item.exercise.type === 'sentence_builder'
      ? this.builtSentence().join(' ')
      : this.userInput.trim();

    const correct = answer.toLowerCase() === item.exercise.answer.toLowerCase();

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
        cur.showExplanation = true;
      }
      updated[this.currentIndex()] = cur;
      return updated;
    });

    if (correct) {
      setTimeout(() => this.next(), 500);
    }
  }

  next() {
    const item = this.currentItem();
    // Re-queue wrong_once items at the end for one more attempt
    if (item?.state === 'wrong_once') {
      this.queue.update(q => [...q, { ...item, state: 'unanswered', showHint: false, userAnswer: '' }]);
    }
    this.currentIndex.update(i => i + 1);
    this.initCurrentExercise();
  }
}
