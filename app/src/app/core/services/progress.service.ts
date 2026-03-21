import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface LessonProgressRow {
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  exercise_score: number | null;
  speak_score: number | null;
  attempts: number;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private auth = inject(AuthService);

  private readonly supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      auth: {
        storage: localStorage,
        storageKey: 'sb-auth-token',
        flowType: 'pkce',
        lock: <R>(_name: string, _timeout: number, fn: () => Promise<R>) => fn(),
      },
    },
  );

  readonly progressMap = signal<Map<string, LessonProgressRow>>(new Map());
  readonly loaded = signal(false);

  async loadAll(): Promise<void> {
    const user = this.auth.currentUser$();
    if (!user) return;

    const { data, error } = await this.supabase
      .from('lesson_progress')
      .select('lesson_id, status, exercise_score, speak_score, attempts, updated_at')
      .eq('user_id', user.id);

    if (error) { console.error('[ProgressService] loadAll:', error.message); return; }

    const map = new Map<string, LessonProgressRow>();
    for (const row of data ?? []) map.set(row.lesson_id, row);
    this.progressMap.set(map);
    this.loaded.set(true);
  }

  getLesson(lessonId: string): LessonProgressRow | null {
    return this.progressMap().get(lessonId) ?? null;
  }

  async saveLesson(
    lessonId: string,
    fields: Partial<Omit<LessonProgressRow, 'lesson_id' | 'updated_at'>>,
  ): Promise<void> {
    const user = this.auth.currentUser$();
    if (!user) return;

    const existing = this.getLesson(lessonId);
    const row = {
      user_id: user.id,
      lesson_id: lessonId,
      status: fields.status ?? existing?.status ?? 'in_progress',
      exercise_score: fields.exercise_score ?? existing?.exercise_score ?? null,
      speak_score: fields.speak_score ?? existing?.speak_score ?? null,
      attempts: (existing?.attempts ?? 0) + 1,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.supabase
      .from('lesson_progress')
      .upsert(row, { onConflict: 'user_id,lesson_id' });

    if (error) { console.error('[ProgressService] saveLesson:', error.message); return; }

    const next = new Map(this.progressMap());
    next.set(lessonId, {
      lesson_id: lessonId,
      status: row.status,
      exercise_score: row.exercise_score,
      speak_score: row.speak_score,
      attempts: row.attempts,
      updated_at: row.updated_at,
    });
    this.progressMap.set(next);
  }
}
