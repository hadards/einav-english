import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-kids-home',
  standalone: true,
  imports: [RouterLink],
  template: `<div style="background:#1a1a2e;min-height:100vh;color:white;display:flex;align-items:center;justify-content:center">
    <p style="font-size:32px">Kids Home 🎮</p>
  </div>`,
})
export class KidsHomeComponent {}
