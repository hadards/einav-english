import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Lesson } from '@shared/lesson.schema';

@Component({
  selector: 'app-explain-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-6">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">The Rule</h2>
        <p class="text-gray-800 leading-relaxed">{{ lesson.explain.rule }}</p>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h2 class="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">💡 Hebrew speakers note</h2>
        <p class="text-amber-900 text-sm leading-relaxed">{{ lesson.explain.hebrew_note }}</p>
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h2 class="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Tip</h2>
        <p class="text-blue-900 text-sm">{{ lesson.explain.tip }}</p>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">✓ Good examples</h2>
        <ul class="flex flex-col gap-3">
          @for (ex of lesson.explain.good_examples; track ex.id) {
            <li class="text-sm text-gray-800 bg-green-50 rounded-lg px-3 py-2 border border-green-100">{{ ex.sentence }}</li>
          }
        </ul>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">✗ Common mistakes</h2>
        <ul class="flex flex-col gap-3">
          @for (ex of lesson.explain.bad_examples; track ex.id) {
            <li class="text-sm bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              <span class="line-through text-red-500">{{ ex.wrong }}</span>
              <span class="text-gray-400 mx-2">→</span>
              <span class="text-green-700 font-medium">{{ ex.correct }}</span>
              <p class="text-gray-500 text-xs mt-1">{{ ex.reason }}</p>
            </li>
          }
        </ul>
      </div>

      <button (click)="startPractice.emit()" class="w-full bg-blue-600 text-white rounded-xl py-4 font-semibold text-base hover:bg-blue-700 transition min-h-[44px]">
        Start practising →
      </button>
    </div>
  `,
})
export class ExplainTabComponent {
  @Input({ required: true }) lesson!: Lesson;
  @Output() startPractice = new EventEmitter<void>();
}
