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

    // onAuthStateChange fires with INITIAL_SESSION on page load (including after
    // OAuth redirect — PKCE code exchange happens inside the SDK before this fires).
    // We mark sessionReady only after that event so the guard doesn't race.
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser$.set(session?.user ?? null);
      this.currentSession$.set(session ?? null);
      if (!this.sessionReady$()) {
        this.sessionReady$.set(true);
      }
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
