import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SYLLABUS } from '@shared/syllabus.constants';
import type { Lesson } from '@shared/lesson.schema';

@Injectable({ providedIn: 'root' })
export class LessonService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Lesson>();

  getLesson(id: string): Observable<Lesson> {
    const cached = this.cache.get(id);
    if (cached) return of(cached);

    const entry = SYLLABUS.find(e => e.id === id && e.type === 'grammar');
    if (!entry) throw new Error(`Unknown lesson id: ${id}`);

    return this.http.get<Lesson>(`assets/${entry.assetPath}`).pipe(
      tap(lesson => this.cache.set(id, lesson))
    );
  }
}
