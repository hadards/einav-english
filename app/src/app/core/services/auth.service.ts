import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      auth: {
        storage: localStorage,
        storageKey: 'sb-auth-token',
        flowType: 'pkce',
        lock: (name, acquireTimeout, fn) => fn(),
      },
    },
  );

  readonly currentUser$ = signal<User | null>(null);
  readonly currentSession$ = signal<Session | null>(null);
  readonly isLoggedIn$ = computed(() => this.currentUser$() !== null);
  readonly sessionReady$ = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);

    this.supabase.auth.getSession().then(({ data }) => {
      this.currentUser$.set(data.session?.user ?? null);
      this.currentSession$.set(data.session ?? null);
      this.sessionReady$.set(true);
    });

    const { data: { subscription } } = this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser$.set(session?.user ?? null);
      this.currentSession$.set(session ?? null);
    });

    destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  async signInWithGoogle(): Promise<void> {
    await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }
}
