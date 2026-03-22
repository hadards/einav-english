import { Component, signal, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KIDS_LOCATIONS, loadKidsProgress, KidsProgress } from './kids.data';

@Component({
  selector: 'app-kids-home',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@700;800;900&display=swap');

    :host { display: block; }

    .world-bg {
      background: linear-gradient(180deg, #87CEEB 0%, #87CEEB 60%, #4ade80 60%, #4ade80 100%);
      min-height: 100vh;
      position: relative;
      overflow: hidden;
    }

    .cloud {
      position: absolute;
      background: white;
      border-radius: 50px;
      opacity: 0.85;
    }
    .cloud::before, .cloud::after {
      content: '';
      position: absolute;
      background: white;
      border-radius: 50%;
    }
    .cloud::before { width: 60%; height: 140%; top: -40%; left: 15%; }
    .cloud::after  { width: 40%; height: 120%; top: -30%; right: 10%; }

    .cloud-1 { width: 120px; height: 40px; top: 8%; left: 5%; animation: drift 18s linear infinite; }
    .cloud-2 { width: 90px;  height: 30px; top: 15%; left: 60%; animation: drift 25s linear infinite reverse; }
    .cloud-3 { width: 140px; height: 45px; top: 25%; left: 30%; animation: drift 22s linear infinite; }
    @keyframes drift {
      from { transform: translateX(-20px); }
      to   { transform: translateX(20px); }
    }

    .platform-card {
      background: white;
      border-radius: 20px;
      border: 4px solid rgba(0,0,0,0.15);
      box-shadow: 0 6px 0 rgba(0,0,0,0.2), 0 8px 20px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      position: relative;
      overflow: hidden;
    }
    .platform-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 0 rgba(0,0,0,0.2), 0 14px 28px rgba(0,0,0,0.15);
    }
    .platform-card:active {
      transform: translateY(2px);
      box-shadow: 0 3px 0 rgba(0,0,0,0.2);
    }
    .platform-card.locked {
      filter: grayscale(0.6);
      cursor: not-allowed;
    }

    .boxy {
      animation: boxy-idle 2s ease-in-out infinite;
    }
    @keyframes boxy-idle {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-8px); }
    }

    .title-text {
      font-family: 'Press Start 2P', monospace;
      text-shadow: 3px 3px 0 rgba(0,0,0,0.3);
    }

    .xp-bar-fill {
      transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1);
    }

    .star { color: #fbbf24; }
    .star-empty { color: #d1d5db; }
  `],
  template: `
    <div class="world-bg">
      <!-- Clouds -->
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
      <div class="cloud cloud-3"></div>

      <!-- Top bar: XP + Level -->
      <div class="px-4 pt-4 pb-2 flex items-center gap-3" style="position:relative;z-index:10">
        <div class="flex items-center gap-2 px-3 py-2 rounded-2xl" style="background:rgba(0,0,0,0.25);backdrop-filter:blur(4px)">
          <span style="font-family:'Press Start 2P',monospace;font-size:9px;color:white">LVL {{ progress().level }}</span>
        </div>
        <div class="flex-1 rounded-full overflow-hidden" style="height:14px;background:rgba(0,0,0,0.2);border:2px solid rgba(255,255,255,0.4)">
          <div class="xp-bar-fill h-full rounded-full" style="background:linear-gradient(90deg,#fbbf24,#f59e0b)" [style.width]="xpPct()+'%'"></div>
        </div>
        <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:white">{{ progress().xp }} XP</span>
      </div>

      <!-- Title -->
      <div class="text-center pt-2 pb-4" style="position:relative;z-index:10">
        <h1 class="title-text text-white" style="font-size:clamp(14px,4vw,20px)">ENGLISH WORLD</h1>
        <p style="font-family:'Nunito',sans-serif;font-size:14px;color:rgba(255,255,255,0.85);margin-top:4px">Choose your level!</p>
      </div>

      <!-- Boxy avatar -->
      <div class="flex justify-center mb-4" style="position:relative;z-index:10">
        <div class="boxy">
          <svg width="64" height="80" viewBox="0 0 64 80" fill="none">
            <rect x="16" y="0" width="32" height="32" rx="4" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
            <rect x="22" y="10" width="8" height="8" rx="2" fill="white"/>
            <rect x="34" y="10" width="8" height="8" rx="2" fill="white"/>
            <rect x="25" y="13" width="4" height="4" rx="1" fill="#1a1a2e"/>
            <rect x="37" y="13" width="4" height="4" rx="1" fill="#1a1a2e"/>
            <path d="M24 24 Q32 30 40 24" stroke="#B8860B" stroke-width="2" fill="none" stroke-linecap="round"/>
            <rect x="12" y="34" width="40" height="28" rx="4" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
            <rect x="0" y="36" width="12" height="10" rx="3" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
            <rect x="52" y="36" width="12" height="10" rx="3" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
            <rect x="14" y="64" width="14" height="16" rx="3" fill="#1a1a2e"/>
            <rect x="36" y="64" width="14" height="16" rx="3" fill="#1a1a2e"/>
          </svg>
        </div>
      </div>

      <!-- Location cards grid -->
      <div class="px-4 pb-8 grid grid-cols-2 gap-4" style="position:relative;z-index:10">
        @for (loc of locations; track loc.id; let i = $index) {
          <div class="platform-card p-4" [class.locked]="isLocked(i)"
            (click)="selectLocation(loc, i)">
            <div class="rounded-xl mb-3 flex items-center justify-center" style="height:70px" [style.background]="'linear-gradient(135deg,'+loc.bgFrom+','+loc.bgTo+')'">
              <span style="font-size:40px">{{ loc.emoji }}</span>
            </div>
            <p style="font-family:'Press Start 2P',monospace;font-size:9px;color:#1a1a2e;margin-bottom:6px">{{ loc.name }}</p>
            <p style="font-family:'Nunito',sans-serif;font-size:11px;color:#6b7280;margin-bottom:8px">Letters {{ loc.letters }}</p>
            <div class="flex gap-0.5">
              @for (s of [1,2,3]; track s) {
                <span [class]="getStars(loc.id) >= s ? 'star' : 'star-empty'" style="font-size:14px">★</span>
              }
            </div>
            @if (isLocked(i)) {
              <div class="absolute inset-0 flex items-center justify-center rounded-2xl" style="background:rgba(255,255,255,0.6)">
                <span style="font-size:32px">🔒</span>
              </div>
            }
            @if (isCompleted(loc.id)) {
              <div class="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style="background:#22c55e;color:white">✓</div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class KidsHomeComponent implements OnInit {
  private router = inject(Router);
  readonly locations = KIDS_LOCATIONS;
  readonly progress = signal<KidsProgress>(loadKidsProgress());

  ngOnInit() {
    this.progress.set(loadKidsProgress());
  }

  xpPct() {
    const xpPerLevel = 50;
    return Math.min(100, ((this.progress().xp % xpPerLevel) / xpPerLevel) * 100);
  }

  isLocked(index: number): boolean {
    if (index === 0) return false;
    const prev = this.locations[index - 1];
    return !this.progress().completedLocations.includes(prev.id);
  }

  isCompleted(locationId: string): boolean {
    return this.progress().completedLocations.includes(locationId);
  }

  getStars(locationId: string): number {
    return this.progress().locationStars[locationId] ?? 0;
  }

  selectLocation(loc: typeof KIDS_LOCATIONS[0], index: number) {
    if (this.isLocked(index)) return;
    this.router.navigate(['/kids/story', loc.id]);
  }
}
