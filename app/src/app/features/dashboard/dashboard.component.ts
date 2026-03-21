import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="min-h-screen bg-gray-50 p-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
      <p class="text-gray-500">Welcome! (Phase 3 will build the real dashboard)</p>
      <button
        (click)="signOut()"
        class="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition min-h-[44px]"
      >
        Sign out
      </button>
    </div>
  `,
})
export class DashboardComponent {
  private auth = inject(AuthService);
  signOut() { this.auth.signOut(); }
}
