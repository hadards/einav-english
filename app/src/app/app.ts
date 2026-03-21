import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ProgressService } from './core/services/progress.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'app';

  constructor() {
    const auth = inject(AuthService);
    const progress = inject(ProgressService);
    effect(() => {
      if (auth.isLoggedIn$()) {
        progress.loadAll();
      }
    });
  }
}
