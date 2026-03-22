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

@Component({
  selector: 'app-explain-tab',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
    :host { font-family: 'DM Sans', sans-serif; }

    .slide-enter-right { animation: enterRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .slide-enter-left  { animation: enterLeft  0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
    @keyframes enterRight {
      from { opacity: 0; transform: translateX(36px) scale(0.97); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes enterLeft {
      from { opacity: 0; transform: translateX(-36px) scale(0.97); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }

    .item-in { animation: fadeSlide 0.22s ease both; }
    @keyframes fadeSlide {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .nav-btn { transition: background 0.15s, transform 0.15s; }
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
            <div class="px-4 pt-4 pb-3 flex items-center gap-2" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:rgba(255,255,255,0.25);color:white">📌 THE RULE</span>
            </div>
            <div class="px-5 py-5 flex flex-col gap-4" style="background:white">
              @for (bullet of ruleBullets(); track $index; let i = $index) {
                <div class="item-in flex items-start gap-3" [style.animation-delay]="i * 60 + 'ms'">
                  @if (ruleBullets().length > 1) {
                    <span class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mt-0.5"
                      style="background:#eef2ff;color:#6366f1;min-width:28px">{{ i + 1 }}</span>
                  }
                  <p class="leading-relaxed" style="font-size:17px;color:#1e1b4b;font-weight:500">{{ bullet }}</p>
                </div>
              }
            </div>
            <ng-container *ngTemplateOutlet="navRow" />
          </div>
        }

        <!-- FORM / STRUCTURE -->
        @if (currentSlide() === 'form') {
          <div class="rounded-2xl overflow-hidden shadow-sm" style="border:1.5px solid #e0e7ff">
            <div class="px-4 pt-4 pb-3 flex items-center gap-2" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:rgba(255,255,255,0.25);color:white">📐 STRUCTURE</span>
            </div>
            <div style="background:white">
              @for (entry of formEntries(); track entry.key; let i = $index) {
                <div class="form-row item-in px-5 py-4" [style.animation-delay]="i * 50 + 'ms'">
                  <p class="text-xs font-bold mb-2" style="color:#a5b4fc;letter-spacing:.05em">{{ formLabel(entry.key) }}</p>
                  <p class="font-mono font-semibold" style="background:#f5f3ff;padding:10px 14px;border-radius:10px;font-size:15px;color:#3730a3">{{ entry.value }}</p>
                </div>
              }
            </div>
            <ng-container *ngTemplateOutlet="navRow" />
          </div>
        }

        <!-- HEBREW NOTE -->
        @if (currentSlide() === 'hebrew') {
          <div class="rounded-2xl overflow-hidden shadow-sm" style="border:1.5px solid #fde68a">
            <div class="px-4 pt-4 pb-3 flex items-center gap-2" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:rgba(255,255,255,0.25);color:white">🇮🇱 עברית — WATCH OUT</span>
            </div>
            <div class="px-5 py-5 flex flex-col gap-4" style="background:white">
              @for (chunk of hebrewBullets(); track $index; let i = $index) {
                <div class="item-in flex items-start gap-3" [style.animation-delay]="i * 60 + 'ms'">
                  <span class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mt-0.5"
                    style="background:#fef3c7;color:#d97706;min-width:28px">{{ i + 1 }}</span>
                  <p class="leading-relaxed" style="font-size:16px;color:#1e1b4b">{{ chunk }}</p>
                </div>
              }
            </div>
            <ng-container *ngTemplateOutlet="navRow" />
          </div>
        }

        <!-- TIP + SPELLING -->
        @if (currentSlide() === 'tip') {
          <div class="rounded-2xl overflow-hidden shadow-sm" style="border:1.5px solid #bfdbfe">
            <div class="px-4 pt-4 pb-3 flex items-center gap-2" style="background:linear-gradient(135deg,#3b82f6,#2563eb)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:rgba(255,255,255,0.25);color:white">💡 TIP</span>
            </div>
            <div class="px-5 py-5 flex flex-col gap-4" style="background:white">
              <p class="leading-relaxed" style="font-size:17px;color:#1e1b4b">{{ lesson.explain.tip }}</p>
              @if (lesson.explain.spelling_rules?.length) {
                <div class="rounded-xl overflow-hidden" style="border:1px solid #e0e7ff">
                  <p class="px-4 py-2.5 text-xs font-bold uppercase tracking-wider" style="background:#f5f3ff;color:#6366f1">Spelling rules</p>
                  @for (sr of lesson.explain.spelling_rules; track $index; let i = $index) {
                    <div class="item-in px-4 py-3 flex flex-col gap-1" [style.animation-delay]="i * 40 + 'ms'"
                      [style.background]="i % 2 === 0 ? 'white' : '#fafafe'"
                      [style.border-top]="i > 0 ? '1px solid #f0eeff' : 'none'">
                      <p class="font-semibold" style="font-size:15px;color:#374151">{{ sr.rule }}</p>
                      <p style="color:#818cf8;font-family:monospace;font-size:13px">{{ sr.examples }}</p>
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
            <div class="px-4 pt-4 pb-3" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:rgba(255,255,255,0.25);color:white">⏱ FREQUENCY</span>
              <p class="text-white mt-2 text-sm opacity-90">{{ lesson.explain.frequency_adverbs!.note }}</p>
            </div>
            <div style="background:white">
              @for (adv of lesson.explain.frequency_adverbs!.list; track adv.word; let i = $index) {
                <div class="item-in flex items-center gap-3 px-4 py-3.5"
                  [style.animation-delay]="i * 35 + 'ms'"
                  [style.border-top]="i > 0 ? '1px solid #f0eeff' : 'none'"
                  [style.background]="i % 2 === 0 ? 'white' : '#fafafe'">
                  <span class="font-black w-24 flex-shrink-0" style="color:#6366f1;font-size:16px">{{ adv.word }}</span>
                  <span class="text-xs text-gray-400 w-28 flex-shrink-0">{{ adv.meaning }}</span>
                  <span class="text-sm text-gray-600 italic">{{ adv.example }}</span>
                </div>
              }
            </div>
            <ng-container *ngTemplateOutlet="navRow" />
          </div>
        }

        <!-- GOOD EXAMPLES -->
        @if (currentSlide() === 'good') {
          <div class="rounded-2xl overflow-hidden shadow-sm" style="border:1.5px solid #bbf7d0">
            <div class="px-4 pt-4 pb-3 flex items-center gap-2" style="background:linear-gradient(135deg,#10b981,#059669)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:rgba(255,255,255,0.25);color:white">✓ GOOD EXAMPLES</span>
            </div>
            <div class="px-5 py-4 flex flex-col gap-3" style="background:white">
              @for (ex of lesson.explain.good_examples; track ex.id; let i = $index) {
                <div class="item-in rounded-xl px-4 py-3" [style.animation-delay]="i * 45 + 'ms'"
                  style="background:#f0fdf4;border:1.5px solid #bbf7d0">
                  <p class="font-semibold" style="font-size:16px;color:#065f46">{{ ex.sentence }}</p>
                  @if (ex.note) {
                    <p class="text-xs mt-1.5" style="color:#6ee7b7">{{ ex.note }}</p>
                  }
                </div>
              }
            </div>
            <ng-container *ngTemplateOutlet="navRow" />
          </div>
        }

        <!-- COMMON MISTAKES -->
        @if (currentSlide() === 'bad') {
          <div class="rounded-2xl overflow-hidden shadow-sm" style="border:1.5px solid #fecdd3">
            <div class="px-4 pt-4 pb-3 flex items-center gap-2" style="background:linear-gradient(135deg,#f43f5e,#e11d48)">
              <span class="text-xs font-black px-2 py-0.5 rounded-full" style="background:rgba(255,255,255,0.25);color:white">✗ COMMON MISTAKES</span>
            </div>
            <div class="px-5 py-4 flex flex-col gap-3" style="background:white">
              @for (ex of lesson.explain.bad_examples; track ex.id; let i = $index) {
                <div class="item-in rounded-xl px-4 py-3" [style.animation-delay]="i * 45 + 'ms'" style="background:#fff1f2;border:1.5px solid #fecdd3">
                  <div class="flex items-center gap-2 flex-wrap mb-1.5">
                    <span class="line-through font-medium" style="color:#f43f5e;font-size:15px">{{ ex.wrong }}</span>
                    <span style="color:#d1d5db;font-size:18px">→</span>
                    <span class="font-bold" style="color:#059669;font-size:15px">{{ ex.correct }}</span>
                  </div>
                  <p class="text-sm" style="color:#9ca3af">{{ ex.reason }}</p>
                </div>
              }
            </div>
            <!-- Last card: Start Practice -->
            <div class="px-5 pb-5 pt-2" style="background:white">
              <div class="flex items-center gap-3">
                <button (click)="prev()" class="nav-btn flex items-center justify-center rounded-xl min-h-[48px] min-w-[48px]"
                  style="background:#f0eeff;color:#6366f1;font-size:20px">
                  ←
                </button>
                <button (click)="startPractice.emit()"
                  class="start-btn flex-1 text-white rounded-xl font-bold min-h-[52px] flex items-center justify-center gap-2"
                  style="font-family:'Sora',sans-serif;font-size:17px">
                  Start Practice ⚡
                </button>
              </div>
            </div>
          </div>
        }

      </div>

      <!-- Reusable nav row -->
      <ng-template #navRow>
        <div class="px-5 pb-5 pt-2 flex items-center gap-3" style="background:white">
          <button (click)="prev()" [disabled]="step() === 0"
            class="nav-btn flex items-center justify-center rounded-xl min-h-[48px] min-w-[48px]"
            style="background:#f0eeff;color:#6366f1;font-size:20px">
            ←
          </button>
          <button (click)="next()"
            class="next-btn flex-1 text-white rounded-xl font-bold min-h-[52px]"
            style="font-size:17px">
            {{ step() === totalSlides() - 2 ? 'Last one →' : 'Got it →' }}
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
  private direction = 1;
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
