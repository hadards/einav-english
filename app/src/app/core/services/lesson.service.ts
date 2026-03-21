import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { SYLLABUS } from '@shared/syllabus.constants';
import type { Lesson } from '@shared/lesson.schema';

@Injectable({ providedIn: 'root' })
export class LessonService {
  private readonly http = inject(HttpClient);
  private readonly resultCache = new Map<string, Lesson>();
  private readonly inflightCache = new Map<string, Observable<Lesson>>();

  getLesson(id: string): Observable<Lesson> {
    const cached = this.resultCache.get(id);
    if (cached) return of(cached);

    const inflight = this.inflightCache.get(id);
    if (inflight) return inflight;

    const entry = SYLLABUS.find(e => e.id === id && e.type === 'grammar');
    if (!entry) throw new Error(`LessonService: unknown grammar lesson id "${id}"`);

    const request$ = this.http.get<Lesson>(`assets/${entry.assetPath}`).pipe(
      tap(lesson => {
        this.resultCache.set(id, lesson);
        this.inflightCache.delete(id);
      }),
      catchError(err => {
        this.inflightCache.delete(id);
        return throwError(() => err);
      }),
      shareReplay(1),
    );

    this.inflightCache.set(id, request$);
    return request$;
  }
}
