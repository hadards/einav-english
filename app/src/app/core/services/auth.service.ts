import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
  );

  readonly currentUser$ = signal<User | null>(null);
  readonly isLoggedIn$ = computed(() => this.currentUser$() !== null);

  constructor() {
    this.supabase.auth.getSession().then(({ data }) => {
      this.currentUser$.set(data.session?.user ?? null);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser$.set(session?.user ?? null);
    });
  }

  async signInWithGoogle(): Promise<void> {
    await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUser$.set(null);
  }
}
