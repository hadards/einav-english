import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LessonService } from '../../core/services/lesson.service';
import { ExplainTabComponent } from './explain-tab.component';
import { PracticeTabComponent } from './practice-tab.component';
import type { Lesson } from '@shared/lesson.schema';

type Tab = 'explain' | 'practice' | 'speak';

@Component({
  selector: 'app-lesson-player',
  standalone: true,
  imports: [CommonModule, RouterLink, ExplainTabComponent, PracticeTabComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="bg-white border-b border-gray-200 px-4 py-3">
        <a routerLink="/dashboard" class="text-blue-600 text-sm">← Dashboard</a>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center h-64 text-gray-400">Loading lesson...</div>
      } @else if (error()) {
        <div class="flex items-center justify-center h-64 text-red-500">{{ error() }}</div>
      } @else if (lesson()) {
        <div class="bg-white px-4 py-4 border-b border-gray-100">
          <div class="max-w-2xl mx-auto">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-mono text-gray-400">{{ lesson()!.id }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">{{ lesson()!.level }}</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900">{{ lesson()!.title }}</h1>
          </div>
        </div>

        <div class="bg-white border-b border-gray-200">
          <div class="max-w-2xl mx-auto flex">
            <button (click)="activeTab.set('explain')" [class]="tabClass('explain')" class="flex-1 py-3 text-sm font-medium transition border-b-2">Explain</button>
            <button (click)="activeTab.set('practice')" [class]="tabClass('practice')" class="flex-1 py-3 text-sm font-medium transition border-b-2">Practice</button>
            <button [disabled]="!practiceUnlocked()" (click)="practiceUnlocked() && activeTab.set('speak')" [class]="tabClass('speak')" class="flex-1 py-3 text-sm font-medium transition border-b-2 disabled:opacity-40">Speak</button>
          </div>
        </div>

        <div class="max-w-2xl mx-auto px-4 py-6">
          @if (activeTab() === 'explain') {
            <app-explain-tab [lesson]="lesson()!" (startPractice)="activeTab.set('practice')" />
          } @else if (activeTab() === 'practice') {
            <app-practice-tab [lesson]="lesson()!" (completed)="onPracticeComplete($event)" />
          } @else {
            <div class="text-center text-gray-500 py-12">
              <p class="text-lg font-medium mb-2">Speaking practice</p>
              <p class="text-sm">Coming in Phase 5</p>
            </div>
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

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly lesson = signal<Lesson | null>(null);
  readonly activeTab = signal<Tab>('explain');
  readonly practiceUnlocked = signal(false);
  readonly practiceScore = signal<number | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/dashboard']); return; }

    this.lessonSvc.getLesson(id).subscribe({
      next: lesson => { this.lesson.set(lesson); this.loading.set(false); },
      error: () => { this.error.set('Could not load lesson.'); this.loading.set(false); },
    });
  }

  tabClass(tab: Tab): string {
    return tab === this.activeTab()
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700';
  }

  onPracticeComplete(score: number) {
    this.practiceScore.set(score);
    if (score >= 0.7) {
      this.practiceUnlocked.set(true);
    }
  }
}
