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
  positive: 'Positive',
  negative: 'Negative',
  question: 'Question',
  short_answer: 'Short answer',
};

const FORM_ICONS: Record<string, string> = {
  positive: '✓',
  negative: '✗',
  question: '?',
  short_answer: '↩',
};

@Component({
  selector: 'app-explain-tab',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
    :host { font-family: 'DM Sans', sans-serif; }

    .slide-in { animation: slideIn 0.28s cubic-bezier(0.16,1,0.3,1) both; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(18px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .item-in { animation: itemIn 0.22s ease both; }
    @keyframes itemIn {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .nav-btn { transition: background 0.15s, transform 0.15s; }
    .nav-btn:hover:not(:disabled) { transform: scale(1.08); }
    .nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }

    .big-btn {
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .big-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(99,102,241,0.35); }
    .big-btn:active { transform: translateY(0); }

    .dot { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }

    .example-nav { transition: all 0.15s; }
    .example-nav:hover:not(:disabled) { transform: scale(1.12); }
    .example-nav:disabled { opacity: 0.2; }
  `],
  template: `
    <div class="flex flex-col gap-4" style="font-family:'DM Sans',sans-serif">

      <!-- Dot progress -->
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-1.5">
          @for (i of slideIndexes(); track i) {
            <div class="dot rounded-full"
              [style.width]="step() === i ? '22px' : '7px'"
              [style.height]="'7px'"
              [style.background]="step() > i ? '#6366f1' : step() === i ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' : '#e0e7ff'">
            </div>
          }
        </div>
        <span class="text-xs font-bold" style="color:#a5b4fc">{{ step() + 1 }}/{{ totalSlides() }}</span>
      </div>

      <!-- ═══ THE RULE ═══ -->
      @if (currentSlide() === 'rule') {
        <div class="slide-in rounded-2xl overflow-hidden" style="background:linear-gradient(145deg,#6366f1,#8b5cf6);box-shadow:0 8px 32px rgba(99,102,241,0.3)">
          <div class="px-5 pt-5 pb-1">
            <span class="text-xs font-black tracking-widest px-3 py-1 rounded-full" style="background:rgba(255,255,255,0.2);color:white">📌 THE RULE</span>
          </div>
          <div class="px-5 py-5 flex flex-col gap-5">
            @for (bullet of ruleBullets(); track $index; let i = $index) {
              <div class="item-in flex items-start gap-3" [style.animation-delay]="i*70+'ms'">
                @if (ruleBullets().length > 1) {
                  <span class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black mt-0.5"
                    style="background:rgba(255,255,255,0.25);color:white;font-size:14px;min-width:32px">{{ i+1 }}</span>
                }
                <p class="text-white leading-relaxed font-medium" style="font-size:18px">{{ bullet }}</p>
              </div>
            }
          </div>
          <ng-container *ngTemplateOutlet="navRow" />
        </div>
      }

      <!-- ═══ STRUCTURE ═══ -->
      @if (currentSlide() === 'form') {
        <div class="slide-in rounded-2xl overflow-hidden" style="background:white;border:1.5px solid #e0e7ff;box-shadow:0 4px 20px rgba(99,102,241,0.1)">
          <div class="px-5 pt-4 pb-3" style="background:linear-gradient(135deg,#eef2ff,#f5f3ff);border-bottom:1px solid #e0e7ff">
            <span class="text-xs font-black tracking-widest" style="color:#6366f1">📐 STRUCTURE</span>
          </div>
          <div class="px-5 py-4 flex flex-col gap-3">
            @for (entry of formEntries(); track entry.key; let i = $index) {
              <div class="item-in" [style.animation-delay]="i*50+'ms'">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style="background:#eef2ff;color:#6366f1">{{ formIcon(entry.key) }}</span>
                  <span class="text-xs font-bold uppercase tracking-wide" style="color:#6366f1">{{ formLabel(entry.key) }}</span>
                </div>
                <p class="font-mono font-semibold rounded-xl px-4 py-3" style="background:#f5f3ff;color:#3730a3;font-size:15px;line-height:1.6">{{ entry.value }}</p>
              </div>
            }
          </div>
          <ng-container *ngTemplateOutlet="navRow" />
        </div>
      }

      <!-- ═══ HEBREW NOTE ═══ -->
      @if (currentSlide() === 'hebrew') {
        <div class="slide-in rounded-2xl overflow-hidden" style="background:linear-gradient(145deg,#f59e0b,#d97706);box-shadow:0 8px 32px rgba(245,158,11,0.25)">
          <div class="px-5 pt-5 pb-1">
            <span class="text-xs font-black tracking-widest px-3 py-1 rounded-full" style="background:rgba(255,255,255,0.2);color:white">🇮🇱 WATCH OUT</span>
          </div>
          <div class="px-5 py-5 flex flex-col gap-5">
            @for (chunk of hebrewBullets(); track $index; let i = $index) {
              <div class="item-in flex items-start gap-3" [style.animation-delay]="i*70+'ms'">
                <span class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black mt-0.5"
                  style="background:rgba(255,255,255,0.25);color:white;font-size:14px;min-width:32px">{{ i+1 }}</span>
                <p class="text-white leading-relaxed font-medium" style="font-size:17px">{{ chunk }}</p>
              </div>
            }
          </div>
          <ng-container *ngTemplateOutlet="navRow" />
        </div>
      }

      <!-- ═══ TIP ═══ -->
      @if (currentSlide() === 'tip') {
        <div class="slide-in rounded-2xl overflow-hidden" style="background:white;border:1.5px solid #bfdbfe;box-shadow:0 4px 20px rgba(59,130,246,0.1)">
          <div class="px-5 pt-4 pb-3" style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border-bottom:1px solid #bfdbfe">
            <span class="text-xs font-black tracking-widest" style="color:#2563eb">💡 TIP</span>
          </div>
          <div class="px-5 py-5 flex flex-col gap-4">
            <p class="leading-relaxed font-medium" style="font-size:18px;color:#1e3a8a">{{ lesson.explain.tip }}</p>

            @if (lesson.explain.spelling_rules?.length) {
              <div class="mt-1">
                <p class="text-xs font-bold uppercase tracking-wider mb-3" style="color:#2563eb">Spelling rules</p>
                <div class="flex flex-col gap-2">
                  @for (sr of lesson.explain.spelling_rules; track $index; let i = $index) {
                    <div class="item-in rounded-xl px-4 py-3" [style.animation-delay]="i*40+'ms'"
                      style="background:#eff6ff;border:1px solid #bfdbfe">
                      <p class="font-semibold" style="font-size:15px;color:#1e40af">{{ sr.rule }}</p>
                      <p class="mt-1 font-mono text-sm" style="color:#6366f1">{{ sr.examples }}</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
          <ng-container *ngTemplateOutlet="navRow" />
        </div>
      }

      <!-- ═══ FREQUENCY ADVERBS ═══ -->
      @if (currentSlide() === 'freq') {
        <div class="slide-in rounded-2xl overflow-hidden" style="background:white;border:1.5px solid #e0e7ff;box-shadow:0 4px 20px rgba(99,102,241,0.1)">
          <div class="px-5 pt-4 pb-2" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
            <span class="text-xs font-black tracking-widest px-3 py-1 rounded-full" style="background:rgba(255,255,255,0.2);color:white">⏱ FREQUENCY</span>
            <p class="text-white mt-2 text-sm opacity-90">{{ lesson.explain.frequency_adverbs!.note }}</p>
          </div>
          <div>
            @for (adv of lesson.explain.frequency_adverbs!.list; track adv.word; let i = $index) {
              <div class="item-in flex items-center gap-3 px-5 py-4"
                [style.animation-delay]="i*30+'ms'"
                [style.border-top]="i>0?'1px solid #f0eeff':'none'"
                [style.background]="i%2===0?'white':'#fafafe'">
                <span class="font-black w-24 flex-shrink-0" style="color:#6366f1;font-size:17px">{{ adv.word }}</span>
                <div class="flex flex-col gap-0.5 flex-1">
                  <span class="text-xs text-gray-400">{{ adv.meaning }}</span>
                  <span class="text-sm italic text-gray-600">{{ adv.example }}</span>
                </div>
              </div>
            }
          </div>
          <ng-container *ngTemplateOutlet="navRow" />
        </div>
      }

      <!-- ═══ GOOD EXAMPLES (one at a time) ═══ -->
      @if (currentSlide() === 'good') {
        <div class="slide-in rounded-2xl overflow-hidden" style="background:white;border:1.5px solid #bbf7d0;box-shadow:0 4px 20px rgba(16,185,129,0.12)">
          <div class="px-5 pt-4 pb-3 flex items-center justify-between" style="background:linear-gradient(135deg,#10b981,#059669)">
            <span class="text-xs font-black tracking-widest px-3 py-1 rounded-full" style="background:rgba(255,255,255,0.2);color:white">✓ GOOD EXAMPLE</span>
            <span class="text-xs font-bold text-white opacity-80">{{ exampleIndex()+1 }}/{{ goodExamples().length }}</span>
          </div>

          <div class="px-5 py-8 flex flex-col items-center gap-4 min-h-[180px] justify-center">
            <p class="text-center font-bold leading-relaxed" style="font-size:22px;color:#065f46">
              "{{ goodExamples()[exampleIndex()].sentence }}"
            </p>
            @if (goodExamples()[exampleIndex()].note) {
              <p class="text-center text-sm" style="color:#6ee7b7">{{ goodExamples()[exampleIndex()].note }}</p>
            }
          </div>

          <!-- Example pagination -->
          <div class="flex items-center justify-center gap-3 pb-4">
            <button (click)="prevExample()" [disabled]="exampleIndex()===0"
              class="example-nav w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style="background:#f0fdf4;color:#059669;font-size:18px;border:none">‹</button>
            <div class="flex gap-1.5">
              @for (i of goodExampleIndexes(); track i) {
                <div class="rounded-full transition-all" style="height:6px"
                  [style.width]="exampleIndex()===i?'18px':'6px'"
                  [style.background]="exampleIndex()===i?'#10b981':'#bbf7d0'"></div>
              }
            </div>
            <button (click)="nextExample()" [disabled]="exampleIndex()===goodExamples().length-1"
              class="example-nav w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style="background:#f0fdf4;color:#059669;font-size:18px;border:none">›</button>
          </div>

          <ng-container *ngTemplateOutlet="navRow" />
        </div>
      }

      <!-- ═══ COMMON MISTAKES (one at a time) ═══ -->
      @if (currentSlide() === 'bad') {
        <div class="slide-in rounded-2xl overflow-hidden" style="background:white;border:1.5px solid #fecdd3;box-shadow:0 4px 20px rgba(244,63,94,0.12)">
          <div class="px-5 pt-4 pb-3 flex items-center justify-between" style="background:linear-gradient(135deg,#f43f5e,#e11d48)">
            <span class="text-xs font-black tracking-widest px-3 py-1 rounded-full" style="background:rgba(255,255,255,0.2);color:white">✗ COMMON MISTAKE</span>
            <span class="text-xs font-bold text-white opacity-80">{{ badIndex()+1 }}/{{ badExamples().length }}</span>
          </div>

          <div class="px-5 py-8 flex flex-col items-center gap-5 min-h-[200px] justify-center">
            <div class="flex flex-col items-center gap-2 w-full">
              <p class="line-through text-center font-semibold" style="color:#f43f5e;font-size:19px">
                {{ badExamples()[badIndex()].wrong }}
              </p>
              <span style="color:#d1d5db;font-size:24px">↓</span>
              <p class="text-center font-bold" style="color:#059669;font-size:19px">
                {{ badExamples()[badIndex()].correct }}
              </p>
            </div>
            <p class="text-center text-sm px-2" style="color:#9ca3af;max-width:280px">
              {{ badExamples()[badIndex()].reason }}
            </p>
          </div>

          <!-- Mistake pagination -->
          <div class="flex items-center justify-center gap-3 pb-4">
            <button (click)="prevBad()" [disabled]="badIndex()===0"
              class="example-nav w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style="background:#fff1f2;color:#e11d48;font-size:18px;border:none">‹</button>
            <div class="flex gap-1.5">
              @for (i of badExampleIndexes(); track i) {
                <div class="rounded-full transition-all" style="height:6px"
                  [style.width]="badIndex()===i?'18px':'6px'"
                  [style.background]="badIndex()===i?'#f43f5e':'#fecdd3'"></div>
              }
            </div>
            <button (click)="nextBad()" [disabled]="badIndex()===badExamples().length-1"
              class="example-nav w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style="background:#fff1f2;color:#e11d48;font-size:18px;border:none">›</button>
          </div>

          <!-- Start Practice -->
          <div class="px-5 pb-5 pt-1">
            <div class="flex items-center gap-3">
              <button (click)="prev()" class="nav-btn flex items-center justify-center rounded-xl min-h-[48px] min-w-[48px]"
                style="background:#fff1f2;color:#f43f5e;font-size:20px;border:none">←</button>
              <button (click)="startPractice.emit()"
                class="big-btn flex-1 text-white rounded-xl font-bold min-h-[52px] flex items-center justify-center gap-2"
                style="background:linear-gradient(135deg,#6366f1,#8b5cf6);font-family:'Sora',sans-serif;font-size:17px;border:none">
                Start Practice ⚡
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Nav template -->
      <ng-template #navRow>
        <div class="px-5 pb-5 pt-2 flex items-center gap-3" style="background:white">
          <button (click)="prev()" [disabled]="step()===0"
            class="nav-btn flex items-center justify-center rounded-xl min-h-[48px] min-w-[48px]"
            style="background:#f0eeff;color:#6366f1;font-size:20px;border:none">←</button>
          <button (click)="next()"
            class="big-btn flex-1 text-white rounded-xl font-bold min-h-[52px]"
            style="background:linear-gradient(135deg,#6366f1,#8b5cf6);font-size:17px;border:none">
            {{ step()===totalSlides()-2 ? 'Last one →' : 'Got it →' }}
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
  readonly exampleIndex = signal(0);
  readonly badIndex = signal(0);
  private direction = 1;
  private slides: string[] = [];

  ngOnInit() {
    this.slides = this.buildSlides();
  }

  private buildSlides(): string[] {
    const s: string[] = ['rule'];
    if (this.lesson.explain.form) s.push('form');
    s.push('hebrew', 'tip');
    if (this.lesson.explain.frequency_adverbs) s.push('freq');
    s.push('good', 'bad');
    return s;
  }

  readonly totalSlides = computed(() => this.slides.length);
  readonly slideIndexes = computed(() => Array.from({ length: this.slides.length }, (_, i) => i));
  readonly currentSlide = computed(() => this.slides[this.step()] ?? 'rule');
  readonly slideClass = computed(() => this.direction >= 0 ? 'slide-enter-right' : 'slide-enter-left');

  readonly goodExamples = computed(() => this.lesson.explain.good_examples);
  readonly badExamples = computed(() => this.lesson.explain.bad_examples);
  readonly goodExampleIndexes = computed(() => Array.from({ length: this.goodExamples().length }, (_, i) => i));
  readonly badExampleIndexes = computed(() => Array.from({ length: this.badExamples().length }, (_, i) => i));

  next() {
    if (this.step() < this.slides.length - 1) {
      this.direction = 1;
      this.step.update(s => s + 1);
      this.exampleIndex.set(0);
      this.badIndex.set(0);
    }
  }

  prev() {
    if (this.step() > 0) {
      this.direction = -1;
      this.step.update(s => s - 1);
    }
  }

  nextExample() { this.exampleIndex.update(i => Math.min(i + 1, this.goodExamples().length - 1)); }
  prevExample() { this.exampleIndex.update(i => Math.max(i - 1, 0)); }
  nextBad() { this.badIndex.update(i => Math.min(i + 1, this.badExamples().length - 1)); }
  prevBad() { this.badIndex.update(i => Math.max(i - 1, 0)); }

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

  formLabel(key: string): string { return FORM_LABELS[key] ?? key; }
  formIcon(key: string): string { return FORM_ICONS[key] ?? '·'; }
}
