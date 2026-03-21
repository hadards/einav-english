import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { SYLLABUS } from '@shared/syllabus.constants';
import type { VocabSet } from '@shared/vocabulary.schema';

@Injectable({ providedIn: 'root' })
export class VocabularyService {
  private readonly http = inject(HttpClient);
  private readonly resultCache = new Map<string, VocabSet>();
  private readonly inflightCache = new Map<string, Observable<VocabSet>>();

  getVocabSet(id: string): Observable<VocabSet> {
    const cached = this.resultCache.get(id);
    if (cached) return of(cached);

    const inflight = this.inflightCache.get(id);
    if (inflight) return inflight;

    const entry = SYLLABUS.find(e => e.id === id && e.type === 'vocabulary');
    if (!entry) throw new Error(`VocabularyService: unknown vocabulary set id "${id}"`);

    const request$ = this.http.get<VocabSet>(`assets/${entry.assetPath}`).pipe(
      tap(vocabSet => {
        this.resultCache.set(id, vocabSet);
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
