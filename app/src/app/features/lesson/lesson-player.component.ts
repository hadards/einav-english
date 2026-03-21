import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LessonService } from '../../core/services/lesson.service';
import { ProgressService } from '../../core/services/progress.service';
import { ExplainTabComponent } from './explain-tab.component';
import { PracticeTabComponent } from './practice-tab.component';
import { SpeakTabComponent } from './speak-tab.component';
import type { Lesson } from '@shared/lesson.schema';

type Tab = 'explain' | 'practice' | 'speak';

@Component({
  selector: 'app-lesson-player',
  standalone: true,
  imports: [CommonModule, RouterLink, ExplainTabComponent, PracticeTabComponent, SpeakTabComponent],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
    :host { font-family: 'DM Sans', sans-serif; }
    .tab-btn { transition: all 0.2s ease; position: relative; }
    .tab-btn::after {
      content: '';
      position: absolute;
      bottom: 0; left: 50%; right: 50%;
      height: 2px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      transition: left 0.2s ease, right 0.2s ease;
      border-radius: 2px 2px 0 0;
    }
    .tab-btn.active::after { left: 12%; right: 12%; }
  `],
  template: `
    <div class="min-h-screen pb-8" style="background:#f5f3ff;font-family:'DM Sans',sans-serif">

      <!-- Top bar -->
      <div style="background:white;border-bottom:1px solid #e0e7ff" class="px-4 py-3 flex items-center gap-3">
        <a routerLink="/dashboard" class="flex items-center justify-center rounded-xl min-h-[36px] min-w-[36px]"
          style="background:#eef2ff;color:#6366f1;font-size:18px;text-decoration:none">
          ←
        </a>
        @if (lesson()) {
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono" style="color:#a5b4fc">{{ lesson()!.id }}</span>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full" style="background:#eef2ff;color:#6366f1">{{ lesson()!.level }}</span>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center h-64" style="color:#a5b4fc">Loading lesson...</div>
      } @else if (error()) {
        <div class="flex items-center justify-center h-64" style="color:#f43f5e">{{ error() }}</div>
      } @else if (lesson()) {

        <!-- Lesson title -->
        <div class="px-4 pt-5 pb-4 max-w-2xl mx-auto">
          <h1 class="text-2xl font-black leading-tight" style="font-family:'Sora',sans-serif;color:#1e1b4b">
            {{ lesson()!.title }}
          </h1>
        </div>

        <!-- Tabs -->
        <div style="background:white;border-bottom:1px solid #e0e7ff" class="max-w-2xl mx-auto">
          <div class="flex px-2">
            <button (click)="activeTab.set('explain')" class="tab-btn flex-1 py-3.5 text-sm font-semibold"
              [class.active]="activeTab() === 'explain'"
              [style.color]="activeTab() === 'explain' ? '#6366f1' : '#94a3b8'">
              📖 Explain
            </button>
            <button (click)="activeTab.set('practice')" class="tab-btn flex-1 py-3.5 text-sm font-semibold"
              [class.active]="activeTab() === 'practice'"
              [style.color]="activeTab() === 'practice' ? '#6366f1' : '#94a3b8'">
              ⚡ Practice
            </button>
            <button (click)="activeTab.set('speak')"
              class="tab-btn flex-1 py-3.5 text-sm font-semibold"
              [class.active]="activeTab() === 'speak'"
              [style.color]="activeTab() === 'speak' ? '#6366f1' : '#94a3b8'">
              🎤 Speak
            </button>
          </div>
        </div>

        <div class="max-w-2xl mx-auto px-4 pt-5">
          @if (activeTab() === 'explain') {
            <app-explain-tab [lesson]="lesson()!" (startPractice)="activeTab.set('practice')" />
          } @else if (activeTab() === 'practice') {
            <app-practice-tab [lesson]="lesson()!" (completed)="onPracticeComplete($event)" />
          } @else {
            <app-speak-tab [lesson]="lesson()!" (completed)="onSpeakComplete($event)" />
          }
        </div>
      }
    </div>
  `,
})
export class LessonPlayerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private lessonSvc = inject(LessonService);
  private progress = inject(ProgressService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly lesson = signal<Lesson | null>(null);
  readonly activeTab = signal<Tab>('explain');
  readonly practiceUnlocked = signal(false);
  readonly practiceScore = signal<number | null>(null);
  readonly speakScore = signal<number | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/dashboard']); return; }

    this.lessonSvc.getLesson(id).subscribe({
      next: lesson => { this.lesson.set(lesson); this.loading.set(false); },
      error: () => { this.error.set('Could not load lesson.'); this.loading.set(false); },
    });
  }

  onPracticeComplete(score: number) {
    this.practiceScore.set(score);
    const id = this.lesson()?.id;
    if (id) this.progress.saveLesson(id, { exercise_score: score, status: 'in_progress' });
  }

  onSpeakComplete(score: number) {
    this.speakScore.set(score);
    const id = this.lesson()?.id;
    if (id) this.progress.saveLesson(id, { speak_score: score, status: 'completed' });
  }
}
