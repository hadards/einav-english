import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&family=Nunito:wght@700;800;900&display=swap');

    :host { font-family: 'DM Sans', sans-serif; }

    .bg-mesh {
      background-color: #f5f3ff;
      background-image:
        radial-gradient(at 20% 20%, rgba(139,92,246,0.18) 0px, transparent 50%),
        radial-gradient(at 80% 10%, rgba(99,102,241,0.15) 0px, transparent 50%),
        radial-gradient(at 60% 80%, rgba(167,139,250,0.12) 0px, transparent 50%);
    }

    .card {
      animation: rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(24px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .feature-item {
      animation: fadeIn 0.4s ease both;
    }
    .feature-item:nth-child(1) { animation-delay: 0.15s; }
    .feature-item:nth-child(2) { animation-delay: 0.25s; }
    .feature-item:nth-child(3) { animation-delay: 0.35s; }
    .feature-item:nth-child(4) { animation-delay: 0.45s; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .google-btn {
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
    }
    .google-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(99,102,241,0.45);
    }
    .google-btn:active { transform: translateY(0); }

    .kids-btn {
      transition: transform 0.12s ease, box-shadow 0.12s ease;
    }
    .kids-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 9px 0 #15803d, 0 12px 28px rgba(34,197,94,0.4);
    }
    .kids-btn:active {
      transform: translateY(3px);
      box-shadow: 0 2px 0 #15803d;
    }

    .level-badge {
      animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .level-badge:nth-child(1) { animation-delay: 0.05s; }
    .level-badge:nth-child(2) { animation-delay: 0.15s; }
    .level-badge:nth-child(3) { animation-delay: 0.25s; }
    @keyframes pop {
      from { opacity: 0; transform: scale(0.6); }
      to   { opacity: 1; transform: scale(1); }
    }
  `],
  template: `
    <div class="min-h-screen bg-mesh flex items-center justify-center px-4 py-12">
      <div class="card w-full max-w-sm flex flex-col gap-0 rounded-3xl overflow-hidden shadow-2xl" style="border:1.5px solid #e0e7ff">

        <!-- Header band -->
        <div class="px-7 pt-8 pb-6" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-3xl">🇬🇧</span>
            <span class="text-white font-bold text-lg" style="font-family:'Sora',sans-serif;opacity:0.9">EnglishApp</span>
          </div>
          <h1 class="text-2xl font-black text-white leading-tight mb-2" style="font-family:'Sora',sans-serif">
            Learn English.<br>The smart way.
          </h1>
          <p class="text-sm" style="color:rgba(255,255,255,0.75)">
            Personalised lessons built for Hebrew speakers
          </p>

          <!-- Level badges -->
          <div class="flex gap-2 mt-4">
            <span class="level-badge text-xs font-bold px-3 py-1 rounded-full" style="background:rgba(255,255,255,0.2);color:white">A2</span>
            <span class="level-badge text-xs font-bold px-3 py-1 rounded-full" style="background:rgba(255,255,255,0.2);color:white">B1</span>
            <span class="level-badge text-xs font-bold px-3 py-1 rounded-full" style="background:rgba(255,255,255,0.2);color:white">B2</span>
          </div>
        </div>

        <!-- Features list -->
        <div class="px-7 py-6 flex flex-col gap-3" style="background:white">
          <div class="feature-item flex items-center gap-3">
            <span class="text-xl w-8 text-center">⚡</span>
            <div>
              <p class="text-sm font-semibold text-gray-800">Grammar lessons</p>
              <p class="text-xs text-gray-400">36 structured lessons from A2 to B2</p>
            </div>
          </div>
          <div class="feature-item flex items-center gap-3">
            <span class="text-xl w-8 text-center">🎤</span>
            <div>
              <p class="text-sm font-semibold text-gray-800">Speaking practice</p>
              <p class="text-xs text-gray-400">Real-time pronunciation feedback</p>
            </div>
          </div>
          <div class="feature-item flex items-center gap-3">
            <span class="text-xl w-8 text-center">🃏</span>
            <div>
              <p class="text-sm font-semibold text-gray-800">Vocabulary flashcards</p>
              <p class="text-xs text-gray-400">360 words with spaced repetition</p>
            </div>
          </div>
          <div class="feature-item flex items-center gap-3">
            <span class="text-xl w-8 text-center">🤖</span>
            <div>
              <p class="text-sm font-semibold text-gray-800">AI conversation chat</p>
              <p class="text-xs text-gray-400">Practice freely with an AI tutor</p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="px-7 pb-8" style="background:white">
          <div style="height:1px;background:#f0eeff;margin-bottom:20px"></div>
          <button (click)="signIn()" class="google-btn w-full flex items-center justify-center gap-3 text-white font-bold py-4 rounded-2xl min-h-[52px]"
            style="font-family:'Sora',sans-serif;font-size:15px">
            <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white" opacity="0.9"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" opacity="0.9"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="white" opacity="0.9"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white" opacity="0.9"/>
            </svg>
            Continue with Google
          </button>
          <p class="text-center text-xs mt-3" style="color:#c4b5fd">Free to use · No credit card</p>

          <!-- Kids Mode -->
          <div class="mt-3">
            <a routerLink="/kids"
              class="kids-btn flex items-center justify-center gap-3 w-full rounded-2xl py-4 font-black"
              style="background:linear-gradient(135deg,#22c55e,#16a34a);color:white;text-decoration:none;font-family:'Nunito',sans-serif;font-size:18px;box-shadow:0 6px 0 #15803d,0 8px 20px rgba(34,197,94,0.35)">
              🎮 Kids Mode
            </a>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  signIn() { this.auth.signInWithGoogle(); }
}
