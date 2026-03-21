import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SyllabusService } from '../../core/services/syllabus.service';
import { VocabularyService } from '../../core/services/vocabulary.service';
import { VocabFlashcardComponent } from './vocab-flashcard.component';
import type { VocabSet } from '@shared/vocabulary.schema';
import type { ContentLevel } from '@shared/syllabus.constants';

type ViewState = 'list' | 'flashcard';

@Component({
  selector: 'app-vocabulary',
  standalone: true,
  imports: [RouterLink, VocabFlashcardComponent],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20 lg:pb-0">

      <!-- Header -->
      <header class="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div class="max-w-3xl mx-auto flex items-center gap-3">
          @if (view() === 'flashcard') {
            <button (click)="backToList()" class="text-blue-600 text-sm">← Back</button>
          } @else {
            <a routerLink="/dashboard" class="text-blue-600 text-sm">← Dashboard</a>
          }
          <h1 class="text-xl font-bold text-gray-900 ml-auto mr-auto">Vocabulary</h1>
        </div>
      </header>

      @if (view() === 'list') {
        <main class="max-w-3xl mx-auto px-4 py-6 lg:px-8">

          <!-- Level filter tabs -->
          <div class="flex gap-2 mb-6">
            @for (lvl of levels; track lvl) {
              <button
                (click)="activeLevel.set(lvl)"
                [class]="lvl === activeLevel() ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'"
                class="px-5 py-2 rounded-full text-sm font-medium transition min-h-[44px]"
              >{{ lvl }}</button>
            }
          </div>

          <!-- Set cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (entry of activeEntries(); track entry.id) {
              <button
                (click)="openSet(entry.id)"
                class="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md hover:border-blue-300 transition"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-mono text-gray-400">{{ entry.id }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">{{ entry.level }}</span>
                </div>
                <p class="font-semibold text-gray-800 text-sm">{{ entry.title }}</p>
                @if (loading() === entry.id) {
                  <p class="text-xs text-gray-400 mt-2">Loading...</p>
                }
              </button>
            }
          </div>
        </main>
      } @else if (view() === 'flashcard' && activeSet()) {
        <app-vocab-flashcard [vocabSet]="activeSet()!" (done)="backToList()" />
      }
    </div>
  `,
})
export class VocabularyComponent {
  private syllabusService = inject(SyllabusService);
  private vocabService = inject(VocabularyService);

  readonly levels: ContentLevel[] = ['A2', 'B1', 'B2'];
  readonly activeLevel = signal<ContentLevel>('A2');
  readonly view = signal<ViewState>('list');
  readonly activeSet = signal<VocabSet | null>(null);
  readonly loading = signal<string | null>(null);

  readonly allVocabEntries = computed(() =>
    this.syllabusService.getByType('vocabulary')
  );

  readonly activeEntries = computed(() =>
    this.allVocabEntries().filter(e => e.level === this.activeLevel())
  );

  openSet(id: string) {
    this.loading.set(id);
    this.vocabService.getVocabSet(id).subscribe({
      next: set => {
        this.activeSet.set(set);
        this.loading.set(null);
        this.view.set('flashcard');
      },
      error: () => {
        this.loading.set(null);
      },
    });
  }

  backToList() {
    this.view.set('list');
    this.activeSet.set(null);
  }
}
