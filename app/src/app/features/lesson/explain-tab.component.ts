import { Component, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Lesson } from '@shared/lesson.schema';

function splitNumbered(text: string): string[] {
  const parts = text.split(/\s*\(\d+\)\s*/);
  return parts.filter(p => p.trim().length > 0);
}

function splitOrdinal(text: string): string[] {
  const parts = text.split(/(?=\b(?:First|Second|Third|Fourth|Also important)[:\s])/);
  return parts.map(p => p.trim()).filter(p => p.length > 0);
}

const FORM_LABELS: Record<string, string> = {
  positive: '✓ Positive',
  negative: '✗ Negative',
  question: '? Question',
  short_answer: '↩ Short answer',
};

interface SlideCard {
  id: string;
  label: string;
  accent: string;       // border + header bg color token
  badgeColor: string;
  badgeBg: string;
  headerBg: string;
}

@Component({
  selector: 'app-explain-tab',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
    :host { font-family: 'DM Sans', sans-serif; }

    .slide-enter-right {
      animation: enterRight 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .slide-enter-left {
      animation: enterLeft 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes enterRight {
      from { opacity: 0; transform: translateX(40px) scale(0.97); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes enterLeft {
      from { opacity: 0; transform: translateX(-40px) scale(0.97); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }

    .item-in { animation: fadeSlide 0.25s ease both; }
    @keyframes fadeSlide {
      from { opacity: 0; transform: translateX(-5px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .nav-btn {
      transition: background 0.15s, transform 0.15s;
    }
    .nav-btn:hover:not(:disabled) { transform: scale(1.1); }
    .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .next-btn {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .next-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.4); }
    .next-btn:active { transform: translateY(0); }

    .start-btn {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .start-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.45); }

    .dot { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }

    .form-row:not(:last-child) { border-bottom: 1px solid #f0eeff; }
    .freq-row:nth-child(even) { background: #fafafe; }
  `],
  template: `
    <div class="flex flex-col gap-4" style="font-family:'DM Sans',sans-serif">

      <!-- Progress dots + counter -->
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-1.5">
          @for (i of slideIndexes(); track i) {
            <div class="dot rounded-full"
              [style.width]="step() === i ? '20px' : '7px'"
              [style.height]="'7px'"
              [style.background]="step() > i ? '#6366f1' : step() === i ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' : '#e0e7ff'">
            </div>
          }
        </div>
        <span class="text-xs font-semibold" style="color:#a5b4fc">{{ step() + 1 }} / {{ totalSlides() }}</span>
      </div>

      <!-- Card -->
      <div [class]="slideClass()">

        <!-- THE RULE -->
        @if (currentSlide() === 'rule') {
          <div class="rounded-2xl overflow-hidden shadow-sm" style="border:1.5px solid #e0e7ff">
            <div class="px-4 pt-3 pb-2 flex items-center gap-2" style="background:linear-gradient(135deg,#eef2ff,#f5f3ff)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:#6366f1;color:white;font-family:'Sora',sans-serif">01</span>
              <span class="text-xs font-bold uppercase tracking-widest" style="color:#6366f1">The Rule</span>
            </div>
            <div class="px-4 py-4 flex flex-col gap-2" style="background:white">
              @for (bullet of ruleBullets(); track $index; let i = $index) {
                <div class="item-in flex items-start gap-2.5" [style.animation-delay]="i * 55 + 'ms'">
                  @if (i === 0 && ruleBullets().length > 1) {
                    <p class="text-gray-700 text-sm leading-relaxed">{{ bullet }}</p>
                  } @else if (ruleBullets().length === 1) {
                    <p class="text-gray-800 leading-relaxed" style="font-size:15px">{{ bullet }}</p>
                  } @else {
                    <span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                      style="background:#eef2ff;color:#6366f1">{{ i }}</span>
                    <p class="text-gray-800 text-sm leading-relaxed">{{ bullet }}</p>
                  }
                </div>
              }
            </div>
            <ng-container *ngTemplateOutlet="navRow" />
          </div>
        }

        <!-- FORM / STRUCTURE -->
        @if (currentSlide() === 'form') {
          <div class="rounded-2xl overflow-hidden shadow-sm" style="border:1.5px solid #e0e7ff">
            <div class="px-4 pt-3 pb-2 flex items-center gap-2" style="background:linear-gradient(135deg,#eef2ff,#f5f3ff)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:#6366f1;color:white;font-family:'Sora',sans-serif">02</span>
              <span class="text-xs font-bold uppercase tracking-widest" style="color:#6366f1">Structure</span>
            </div>
            <div style="background:white">
              @for (entry of formEntries(); track entry.key; let i = $index) {
                <div class="form-row item-in px-4 py-3" [style.animation-delay]="i * 50 + 'ms'">
                  <p class="text-xs font-bold mb-1" style="color:#a5b4fc">{{ formLabel(entry.key) }}</p>
                  <p class="text-sm font-mono text-gray-800" style="background:#f8f7ff;padding:6px 10px;border-radius:8px">{{ entry.value }}</p>
                </div>
              }
            </div>
            <ng-container *ngTemplateOutlet="navRow" />
          </div>
        }

        <!-- HEBREW NOTE -->
        @if (currentSlide() === 'hebrew') {
          <div class="rounded-2xl overflow-hidden shadow-sm" style="border:1.5px solid #fef3c7">
            <div class="px-4 pt-3 pb-2 flex items-center gap-2" style="background:linear-gradient(135deg,#fffbeb,#fef9f0)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:#f59e0b;color:white;font-family:'Sora',sans-serif">🇮🇱</span>
              <span class="text-xs font-bold uppercase tracking-widest" style="color:#d97706">Hebrew Speakers</span>
            </div>
            <div class="px-4 py-4 flex flex-col gap-2" style="background:white">
              @for (chunk of hebrewBullets(); track $index; let i = $index) {
                <div class="item-in flex items-start gap-2.5" [style.animation-delay]="i * 60 + 'ms'">
                  <span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                    style="background:#fef3c7;color:#d97706">{{ i + 1 }}</span>
                  <p class="text-gray-700 text-sm leading-relaxed">{{ chunk }}</p>
                </div>
              }
            </div>
            <ng-container *ngTemplateOutlet="navRow" />
          </div>
        }

        <!-- TIP + SPELLING -->
        @if (currentSlide() === 'tip') {
          <div class="rounded-2xl overflow-hidden shadow-sm" style="border:1.5px solid #dbeafe">
            <div class="px-4 pt-3 pb-2 flex items-center gap-2" style="background:linear-gradient(135deg,#eff6ff,#f0f9ff)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:#3b82f6;color:white;font-family:'Sora',sans-serif">💡</span>
              <span class="text-xs font-bold uppercase tracking-widest" style="color:#2563eb">Tip</span>
            </div>
            <div class="px-4 py-4 flex flex-col gap-3" style="background:white">
              <p class="text-sm text-gray-700 leading-relaxed">{{ lesson.explain.tip }}</p>
              @if (lesson.explain.spelling_rules?.length) {
                <div class="rounded-xl overflow-hidden" style="border:1px solid #e0e7ff">
                  <p class="px-3 py-2 text-xs font-bold uppercase tracking-widest" style="background:#f5f3ff;color:#6366f1">Spelling rules</p>
                  @for (sr of lesson.explain.spelling_rules; track $index; let i = $index) {
                    <div class="item-in px-3 py-2.5 flex flex-col gap-0.5" [style.animation-delay]="i * 40 + 'ms'"
                      [style.background]="i % 2 === 0 ? 'white' : '#fafafe'"
                      [style.border-top]="i > 0 ? '1px solid #f0eeff' : 'none'">
                      <p class="text-xs font-semibold text-gray-800">{{ sr.rule }}</p>
                      <p class="text-xs" style="color:#818cf8;font-family:monospace">{{ sr.examples }}</p>
                    </div>
                  }
                </div>
              }
            </div>
            <ng-container *ngTemplateOutlet="navRow" />
          </div>
        }

        <!-- FREQUENCY ADVERBS -->
        @if (currentSlide() === 'freq') {
          <div class="rounded-2xl overflow-hidden shadow-sm" style="border:1.5px solid #e0e7ff">
            <div class="px-4 pt-3 pb-2 flex items-center gap-2" style="background:linear-gradient(135deg,#eef2ff,#f5f3ff)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:#6366f1;color:white;font-family:'Sora',sans-serif">⏱</span>
              <span class="text-xs font-bold uppercase tracking-widest" style="color:#6366f1">Frequency Adverbs</span>
            </div>
            <div class="px-4 py-4 flex flex-col gap-2" style="background:white">
              <p class="text-xs text-gray-500 mb-1">{{ lesson.explain.frequency_adverbs!.note }}</p>
              <div class="rounded-xl overflow-hidden" style="border:1px solid #e0e7ff">
                @for (adv of lesson.explain.frequency_adverbs!.list; track adv.word; let i = $index) {
                  <div class="freq-row item-in flex items-center gap-3 px-3 py-2.5"
                    [style.animation-delay]="i * 35 + 'ms'"
                    [style.border-top]="i > 0 ? '1px solid #f0eeff' : 'none'">
                    <span class="text-sm font-bold w-28 flex-shrink-0" style="color:#6366f1">{{ adv.word }}</span>
                    <span class="text-xs text-gray-400 w-28 flex-shrink-0">{{ adv.meaning }}</span>
                    <span class="text-xs text-gray-600 italic">{{ adv.example }}</span>
                  </div>
                }
              </div>
            </div>
            <ng-container *ngTemplateOutlet="navRow" />
          </div>
        }

        <!-- GOOD EXAMPLES -->
        @if (currentSlide() === 'good') {
          <div class="rounded-2xl overflow-hidden shadow-sm" style="border:1.5px solid #d1fae5">
            <div class="px-4 pt-3 pb-2 flex items-center gap-2" style="background:linear-gradient(135deg,#ecfdf5,#f0fdf4)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:#10b981;color:white;font-family:'Sora',sans-serif">✓</span>
              <span class="text-xs font-bold uppercase tracking-widest" style="color:#059669">Good Examples</span>
            </div>
            <div class="px-4 py-4 flex flex-col gap-2" style="background:white">
              @for (ex of lesson.explain.good_examples; track ex.id; let i = $index) {
                <div class="item-in" [style.animation-delay]="i * 45 + 'ms'">
                  <div class="rounded-xl px-3 py-2.5" style="background:#f0fdf4;border:1px solid #bbf7d0">
                    <p class="text-sm font-semibold text-gray-800">{{ ex.sentence }}</p>
                    @if (ex.note) {
                      <p class="text-xs mt-1" style="color:#6ee7b7">{{ ex.note }}</p>
                    }
                  </div>
                </div>
              }
            </div>
            <ng-container *ngTemplateOutlet="navRow" />
          </div>
        }

        <!-- COMMON MISTAKES -->
        @if (currentSlide() === 'bad') {
          <div class="rounded-2xl overflow-hidden shadow-sm" style="border:1.5px solid #ffe4e6">
            <div class="px-4 pt-3 pb-2 flex items-center gap-2" style="background:linear-gradient(135deg,#fff1f2,#fff5f5)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:#f43f5e;color:white;font-family:'Sora',sans-serif">✗</span>
              <span class="text-xs font-bold uppercase tracking-widest" style="color:#e11d48">Common Mistakes</span>
            </div>
            <div class="px-4 py-4 flex flex-col gap-2" style="background:white">
              @for (ex of lesson.explain.bad_examples; track ex.id; let i = $index) {
                <div class="item-in rounded-xl px-3 py-2.5" [style.animation-delay]="i * 45 + 'ms'" style="background:#fff1f2;border:1px solid #fecdd3">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="text-sm line-through" style="color:#f43f5e">{{ ex.wrong }}</span>
                    <span style="color:#d1d5db">→</span>
                    <span class="text-sm font-semibold" style="color:#059669">{{ ex.correct }}</span>
                  </div>
                  <p class="text-xs" style="color:#9ca3af">{{ ex.reason }}</p>
                </div>
              }
            </div>
            <!-- Last card: Start Practice instead of Next -->
            <div class="px-4 pb-5" style="background:white">
              <div class="flex items-center gap-3 pt-2">
                <button (click)="prev()" class="nav-btn flex items-center justify-center rounded-xl min-h-[44px] min-w-[44px]"
                  style="background:#f0eeff;color:#6366f1;font-size:18px">
                  ←
                </button>
                <button (click)="startPractice.emit()"
                  class="start-btn flex-1 text-white rounded-xl py-3 font-bold text-sm min-h-[44px] flex items-center justify-center gap-2"
                  style="font-family:'Sora',sans-serif">
                  Start Practice ⚡
                </button>
              </div>
            </div>
          </div>
        }

      </div>

      <!-- Reusable nav row -->
      <ng-template #navRow>
        <div class="px-4 pb-4 pt-2 flex items-center gap-3" style="background:white">
          <button (click)="prev()" [disabled]="step() === 0"
            class="nav-btn flex items-center justify-center rounded-xl min-h-[44px] min-w-[44px]"
            style="background:#f0eeff;color:#6366f1;font-size:18px">
            ←
          </button>
          <button (click)="next()"
            class="next-btn flex-1 text-white rounded-xl py-3 font-semibold text-sm min-h-[44px]">
            {{ step() === totalSlides() - 2 ? 'Last step →' : 'Got it →' }}
          </button>
        </div>
      </ng-template>

    </div>
  `,
})
export class ExplainTabComponent implements OnInit {
  @Input({ required: true }) lesson!: Lesson;
  @Output() startPractice = new EventEmitter<void>();

  readonly step = signal(0);
  private direction = 1; // 1 = forward, -1 = back
  private slides: string[] = [];

  ngOnInit() {
    this.slides = this.buildSlides();
  }

  private buildSlides(): string[] {
    const s: string[] = ['rule'];
    if (this.lesson.explain.form) s.push('form');
    s.push('hebrew');
    s.push('tip');
    if (this.lesson.explain.frequency_adverbs) s.push('freq');
    s.push('good');
    s.push('bad');
    return s;
  }

  readonly totalSlides = computed(() => this.slides.length);
  readonly slideIndexes = computed(() => Array.from({ length: this.slides.length }, (_, i) => i));
  readonly currentSlide = computed(() => this.slides[this.step()] ?? 'rule');
  readonly slideClass = computed(() =>
    this.direction >= 0 ? 'slide-enter-right' : 'slide-enter-left'
  );

  next() {
    if (this.step() < this.slides.length - 1) {
      this.direction = 1;
      this.step.update(s => s + 1);
    }
  }

  prev() {
    if (this.step() > 0) {
      this.direction = -1;
      this.step.update(s => s - 1);
    }
  }

  ruleBullets(): string[] {
    const rule = this.lesson.explain.rule;
    if (rule.includes('(1)')) return splitNumbered(rule);
    return [rule];
  }

  hebrewBullets(): string[] {
    const note = this.lesson.explain.hebrew_note;
    if (/\bFirst[:\s]/i.test(note)) return splitOrdinal(note);
    return [note];
  }

  formEntries(): { key: string; value: string }[] {
    const form = this.lesson.explain.form;
    if (!form) return [];
    return Object.entries(form).map(([key, value]) => ({ key, value }));
  }

  formLabel(key: string): string {
    return FORM_LABELS[key] ?? key;
  }
}
