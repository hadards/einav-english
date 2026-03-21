import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SyllabusService } from '../../core/services/syllabus.service';
import type { ContentLevel } from '@shared/syllabus.constants';

type LessonStatus = 'not_started' | 'in_progress' | 'completed';

interface LessonProgress {
  id: string;
  title: string;
  level: ContentLevel;
  type: 'grammar' | 'vocabulary';
  status: LessonStatus;
  score: number;
}

const LEVELS: ContentLevel[] = ['A2', 'B1', 'B2'];

const LEVEL_COLORS: Record<ContentLevel, { bar: string; badge: string }> = {
  A2: { bar: 'bg-green-500', badge: 'bg-green-100 text-green-800' },
  B1: { bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800' },
  B2: { bar: 'bg-purple-500', badge: 'bg-purple-100 text-purple-800' },
};

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20 lg:pb-0">

      <!-- Header -->
      <header class="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div class="max-w-3xl mx-auto flex items-center">
          <a routerLink="/dashboard" class="text-blue-600 text-sm">← Dashboard</a>
          <h1 class="text-xl font-bold text-gray-900 mx-auto">My Progress</h1>
        </div>
      </header>

      <main class="max-w-3xl mx-auto px-4 py-6 lg:px-8 flex flex-col gap-6">

        <!-- Overall stats card -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-gray-800">Overall progress</h2>
            <span class="text-2xl font-bold text-blue-600">{{ overallPct() }}%</span>
          </div>
          <div class="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              class="h-full bg-blue-500 rounded-full transition-all duration-700"
              [style.width]="overallPct() + '%'"
            ></div>
          </div>
          <div class="flex justify-between text-sm text-gray-500">
            <span>{{ completedCount() }} of {{ allLessons().length }} lessons complete</span>
            <span>{{ inProgressCount() }} in progress</span>
          </div>
        </div>

        <!-- Streak card -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div class="text-4xl">🔥</div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ streak }}</p>
            <p class="text-sm text-gray-500">day streak</p>
          </div>
          <p class="text-xs text-gray-400 ml-auto">Streak tracking coming soon</p>
        </div>

        <!-- Per-level progress -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
          <h2 class="text-base font-semibold text-gray-800">By level</h2>
          @for (level of levels; track level) {
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full {{ levelBadge(level) }}">{{ level }}</span>
                <span class="text-xs text-gray-500">{{ levelCompleted(level) }}/{{ levelTotal(level) }}</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-700 {{ levelBar(level) }}"
                  [style.width]="levelPct(level) + '%'"
                ></div>
              </div>
            </div>
          }
        </div>

        <!-- Suggested next lessons -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-base font-semibold text-gray-800 mb-4">Keep practising</h2>
          @if (suggestedLessons().length === 0) {
            <p class="text-sm text-gray-400">All lessons complete! 🎉</p>
          } @else {
            <div class="flex flex-col gap-3">
              @for (lesson of suggestedLessons(); track lesson.id) {
                <a
                  [routerLink]="lesson.type === 'grammar' ? ['/lesson', lesson.id] : ['/vocabulary']"
                  class="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition"
                >
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-800">{{ lesson.title }}</p>
                    <p class="text-xs text-gray-400 capitalize">{{ lesson.type }} · {{ lesson.level }}</p>
                  </div>
                  <span class="text-xs text-gray-400">→</span>
                </a>
              }
            </div>
          }
        </div>

      </main>
    </div>
  `,
})
export class ProgressComponent {
  private syllabusService = inject(SyllabusService);

  readonly levels = LEVELS;
  readonly streak = 0; // Phase 9+ will wire to Supabase

  readonly allLessons = computed<LessonProgress[]>(() =>
    this.syllabusService.getAll().map(e => ({
      id: e.id,
      title: e.title,
      level: e.level,
      type: e.type as 'grammar' | 'vocabulary',
      status: 'not_started' as LessonStatus,
      score: 0,
    }))
  );

  readonly completedCount = computed(() =>
    this.allLessons().filter(l => l.status === 'completed').length
  );

  readonly inProgressCount = computed(() =>
    this.allLessons().filter(l => l.status === 'in_progress').length
  );

  readonly overallPct = computed(() => {
    const total = this.allLessons().length;
    return total ? Math.round((this.completedCount() / total) * 100) : 0;
  });

  levelTotal(level: ContentLevel): number {
    return this.allLessons().filter(l => l.level === level).length;
  }

  levelCompleted(level: ContentLevel): number {
    return this.allLessons().filter(l => l.level === level && l.status === 'completed').length;
  }

  levelPct(level: ContentLevel): number {
    const total = this.levelTotal(level);
    return total ? Math.round((this.levelCompleted(level) / total) * 100) : 0;
  }

  levelBar(level: ContentLevel): string {
    return LEVEL_COLORS[level].bar;
  }

  levelBadge(level: ContentLevel): string {
    return LEVEL_COLORS[level].badge;
  }

  readonly suggestedLessons = computed(() =>
    this.allLessons()
      .filter(l => l.status !== 'completed')
      .slice(0, 5)
  );
}
