import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { KIDS_LOCATIONS, loadKidsProgress, KidsProgress } from './kids.data';

@Component({
  selector: 'app-kids-home',
  standalone: true,
  imports: [],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@700;800;900&display=swap');

    :host { display: block; }

    .map-bg {
      min-height: 100vh;
      background:
        radial-gradient(ellipse at 20% 10%, rgba(255,220,100,0.18) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 90%, rgba(100,200,255,0.15) 0%, transparent 50%),
        linear-gradient(160deg, #1a1a3e 0%, #0f2027 40%, #1a3a2a 100%);
      position: relative;
      overflow: hidden;
    }

    /* Twinkling stars */
    .star-field { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
    .star-dot {
      position: absolute;
      width: 3px; height: 3px;
      background: white;
      border-radius: 50%;
      animation: twinkle var(--dur) ease-in-out infinite;
      animation-delay: var(--delay);
    }
    @keyframes twinkle {
      0%,100% { opacity: 0.2; transform: scale(1); }
      50%      { opacity: 1;   transform: scale(1.5); }
    }

    /* Path SVG line */
    .map-path {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
    }

    /* Island nodes */
    .island-node {
      position: absolute;
      z-index: 2;
      transform: translate(-50%, -50%);
      cursor: pointer;
    }

    .island-ring {
      position: relative;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
      filter: drop-shadow(0 8px 24px rgba(0,0,0,0.5));
    }
    .island-ring:hover { transform: scale(1.12); }
    .island-ring:active { transform: scale(0.95); }

    .island-ring.locked {
      filter: grayscale(0.8) drop-shadow(0 4px 12px rgba(0,0,0,0.4));
      cursor: default;
    }
    .island-ring.locked:hover { transform: none; }

    .island-pulse {
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      animation: islandPulse 2.5s ease-in-out infinite;
    }
    @keyframes islandPulse {
      0%,100% { opacity: 0.4; transform: scale(1); }
      50%      { opacity: 0;   transform: scale(1.3); }
    }

    .island-float {
      animation: islandFloat var(--float-dur) ease-in-out infinite;
      animation-delay: var(--float-delay);
    }
    @keyframes islandFloat {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-10px); }
    }

    /* Popup panel */
    .popup-overlay {
      position: fixed; inset: 0; z-index: 50;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

    .popup-card {
      width: 100%; max-width: 340px;
      border-radius: 28px;
      overflow: hidden;
      animation: popUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes popUp {
      from { opacity:0; transform: scale(0.7) translateY(30px); }
      to   { opacity:1; transform: scale(1) translateY(0); }
    }

    .activity-btn {
      transition: transform 0.12s ease, box-shadow 0.12s ease;
      box-shadow: 0 5px 0 rgba(0,0,0,0.3);
      border: none; cursor: pointer;
    }
    .activity-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 0 rgba(0,0,0,0.25); }
    .activity-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(0,0,0,0.25); }

    /* Stars */
    .star-filled { color: #fbbf24; text-shadow: 0 0 8px rgba(251,191,36,0.8); }
    .star-empty  { color: rgba(255,255,255,0.2); }

    /* Top bar */
    .top-bar {
      position: relative; z-index: 10;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .xp-bar-fill { transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1); }

    .boxy { animation: boxyFloat 2s ease-in-out infinite; }
    @keyframes boxyFloat {
      0%,100% { transform: translateY(0) rotate(0deg); }
      50%      { transform: translateY(-6px) rotate(2deg); }
    }

    /* Lock badge */
    .lock-badge {
      position: absolute; top: -4px; right: -4px;
      width: 22px; height: 22px;
      background: #374151;
      border-radius: 50%;
      display: flex; align-items: center; justify-center: center;
      font-size: 11px;
      border: 2px solid rgba(255,255,255,0.2);
    }

    /* Stars badge on island */
    .island-stars {
      position: absolute;
      bottom: -18px;
      left: 50%;
      transform: translateX(-50%);
      display: flex; gap: 2px;
      white-space: nowrap;
    }
  `],
  template: `
    <div class="map-bg">

      <!-- Star field -->
      <div class="star-field">
        @for (s of stars; track s.id) {
          <div class="star-dot"
            [style.left]="s.x+'%'"
            [style.top]="s.y+'%'"
            [style.--dur]="s.dur+'s'"
            [style.--delay]="s.delay+'s'">
          </div>
        }
      </div>

      <!-- Top bar -->
      <div class="top-bar px-4 py-3 flex items-center gap-3">
        <!-- Boxy avatar -->
        <div class="boxy flex-shrink-0">
          <svg width="36" height="44" viewBox="0 0 64 80" fill="none">
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
        <div class="flex flex-col gap-1 flex-1">
          <div class="flex justify-between items-center">
            <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:white">LVL {{ progress().level }}</span>
            <span style="font-family:'Press Start 2P',monospace;font-size:7px;color:#fbbf24">{{ progress().xp }} XP</span>
          </div>
          <div class="rounded-full overflow-hidden" style="height:10px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2)">
            <div class="xp-bar-fill h-full rounded-full" style="background:linear-gradient(90deg,#fbbf24,#f59e0b)" [style.width]="xpPct()+'%'"></div>
          </div>
        </div>
        <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:white;text-align:right;line-height:1.4">
          ENGLISH<br>WORLD
        </div>
      </div>

      <!-- Map canvas -->
      <div class="relative" style="height: calc(100vh - 68px); min-height: 520px;">

        <!-- SVG path connecting islands -->
        <svg class="map-path" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <!-- Dotted path between all 6 islands -->
          <path d="M 20 82 Q 35 68 50 72 Q 65 76 80 62 Q 88 50 75 38 Q 62 26 50 30 Q 35 34 20 22"
            fill="none"
            stroke="rgba(251,191,36,0.5)"
            stroke-width="1.2"
            stroke-dasharray="3 2.5"
            filter="url(#glow)"
          />
          <!-- Glow version -->
          <path d="M 20 82 Q 35 68 50 72 Q 65 76 80 62 Q 88 50 75 38 Q 62 26 50 30 Q 35 34 20 22"
            fill="none"
            stroke="rgba(251,191,36,0.15)"
            stroke-width="4"
          />
        </svg>

        <!-- Islands -->
        @for (loc of locations; track loc.id; let i = $index) {
          <div class="island-node"
            [style.left]="nodePos[i].x+'%'"
            [style.top]="nodePos[i].y+'%'"
            (click)="openIsland(loc, i)">

            <div class="island-float"
              [style.--float-dur]="(2.2 + i * 0.3)+'s'"
              [style.--float-delay]="(i * 0.4)+'s'">

              <!-- Pulse ring (only unlocked) -->
              @if (!isLocked(i)) {
                <div class="island-pulse" [style.background]="loc.color" style="opacity:0.35"></div>
              }

              <!-- Island circle -->
              <div class="island-ring" [class.locked]="isLocked(i)"
                [style.width]="nodePos[i].size+'px'"
                [style.height]="nodePos[i].size+'px'"
                [style.background]="'linear-gradient(145deg,'+loc.bgFrom+','+loc.bgTo+')'">

                <!-- Lock overlay -->
                @if (isLocked(i)) {
                  <div style="position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center">
                    <span style="font-size:22px">🔒</span>
                  </div>
                }

                <span [style.font-size]="(nodePos[i].size * 0.42)+'px'" style="line-height:1;position:relative;z-index:1">{{ loc.emoji }}</span>
              </div>

              <!-- Name label -->
              <div style="text-align:center;margin-top:6px">
                <p style="font-family:'Press Start 2P',monospace;font-size:7px;color:white;text-shadow:1px 1px 0 rgba(0,0,0,0.8);white-space:nowrap">{{ loc.name }}</p>
                <!-- Stars below island -->
                <div class="flex justify-center gap-1 mt-1">
                  @for (s of [1,2,3]; track s) {
                    <span [class]="getStars(loc.id) >= s ? 'star-filled' : 'star-empty'" style="font-size:10px">★</span>
                  }
                </div>
              </div>

            </div>
          </div>
        }

      </div>

      <!-- Popup panel -->
      @if (selected()) {
        <div class="popup-overlay" (click)="closeIsland()">
          <div class="popup-card" (click)="$event.stopPropagation()">

            <!-- Header -->
            <div class="px-6 pt-6 pb-4 flex flex-col items-center gap-2 text-center"
              [style.background]="'linear-gradient(135deg,'+selected()!.bgFrom+','+selected()!.bgTo+')'">
              <span style="font-size:64px;line-height:1;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3))">{{ selected()!.emoji }}</span>
              <p style="font-family:'Press Start 2P',monospace;font-size:14px;color:white;text-shadow:2px 2px 0 rgba(0,0,0,0.3)">{{ selected()!.name }}</p>
              <p style="font-family:'Nunito',sans-serif;font-size:13px;color:rgba(255,255,255,0.85);font-weight:800">Letters {{ selected()!.letters }}</p>
              <!-- Stars -->
              <div class="flex gap-2">
                @for (s of [1,2,3]; track s) {
                  <span [class]="getStars(selected()!.id) >= s ? 'star-filled' : 'star-empty'" style="font-size:20px">★</span>
                }
              </div>
            </div>

            <!-- Activities -->
            <div class="px-5 py-5 flex flex-col gap-3" style="background:#1a1a3e">

              <!-- Story — always available -->
              <button class="activity-btn w-full rounded-2xl py-4 px-5 flex items-center gap-4 text-white"
                style="background:linear-gradient(135deg,#22c55e,#16a34a);font-family:'Nunito',sans-serif"
                (click)="go('story')">
                <span style="font-size:28px">📖</span>
                <div style="text-align:left">
                  <p style="font-family:'Press Start 2P',monospace;font-size:10px;margin-bottom:3px">STORY</p>
                  <p style="font-size:12px;opacity:0.85">Learn the letters!</p>
                </div>
                <span style="margin-left:auto;font-size:18px">▶</span>
              </button>

              <!-- Games — locked until story done -->
              @for (game of games; track game.mode) {
                <button class="activity-btn w-full rounded-2xl py-4 px-5 flex items-center gap-4 text-white"
                  [style.background]="isCompleted(selected()!.id) ? game.bg : 'rgba(255,255,255,0.07)'"
                  [style.opacity]="isCompleted(selected()!.id) ? '1' : '0.5'"
                  [disabled]="!isCompleted(selected()!.id)"
                  style="font-family:'Nunito',sans-serif"
                  (click)="go(game.mode)">
                  <span style="font-size:28px">{{ game.icon }}</span>
                  <div style="text-align:left">
                    <p style="font-family:'Press Start 2P',monospace;font-size:10px;margin-bottom:3px">{{ game.label }}</p>
                    <p style="font-size:12px;opacity:0.85">{{ game.desc }}</p>
                  </div>
                  @if (!isCompleted(selected()!.id)) {
                    <span style="margin-left:auto;font-size:16px">🔒</span>
                  } @else {
                    <span style="margin-left:auto;font-size:18px">▶</span>
                  }
                </button>
              }

            </div>

            <!-- Close -->
            <button (click)="closeIsland()"
              style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.35);border:none;color:white;font-size:18px;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>

          </div>
        </div>
      }

    </div>
  `,
})
export class KidsHomeComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  readonly locations = KIDS_LOCATIONS;
  readonly progress = signal<KidsProgress>(loadKidsProgress());
  readonly selected = signal<typeof KIDS_LOCATIONS[0] | null>(null);
  private selectedIndex = 0;

  // Island positions on the map (% left, % top, size px)
  readonly nodePos = [
    { x: 20, y: 82, size: 80 },  // Farm      — bottom left
    { x: 50, y: 70, size: 76 },  // City      — bottom centre
    { x: 80, y: 60, size: 72 },  // Ocean     — mid right
    { x: 75, y: 36, size: 76 },  // Space     — upper right
    { x: 48, y: 24, size: 72 },  // Home      — upper centre
    { x: 20, y: 16, size: 80 },  // Carnival  — top left
  ];

  // Twinkling stars
  readonly stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    dur: 2 + Math.random() * 3,
    delay: Math.random() * 4,
  }));

  readonly games = [
    { mode: 'tap',   icon: '⚡', label: 'TAP IT',    desc: 'Tap the right picture!', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { mode: 'spell', icon: '🔤', label: 'SPELL IT',  desc: 'Tap letters in order!',  bg: 'linear-gradient(135deg,#0ea5e9,#0284c7)' },
    { mode: 'speed', icon: '⏱', label: 'SPEED RUN', desc: '30 seconds — go fast!',  bg: 'linear-gradient(135deg,#f43f5e,#e11d48)' },
  ];

  ngOnInit() {
    this.progress.set(loadKidsProgress());
    this.speakWelcome();
  }

  ngOnDestroy() { speechSynthesis.cancel(); }

  private speakWelcome() {
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance('Welcome to English World! Tap an island to start your adventure!');
    utt.lang = 'en-US'; utt.rate = 0.8; utt.pitch = 1.2;
    speechSynthesis.speak(utt);
  }

  xpPct() {
    const xpPerLevel = 50;
    return Math.min(100, ((this.progress().xp % xpPerLevel) / xpPerLevel) * 100);
  }

  isLocked(index: number): boolean {
    // Unlock everything — remove lock logic for testing
    return false;
  }

  isCompleted(locationId: string): boolean {
    return this.progress().completedLocations.includes(locationId);
  }

  getStars(locationId: string): number {
    return this.progress().locationStars[locationId] ?? 0;
  }

  openIsland(loc: typeof KIDS_LOCATIONS[0], index: number) {
    if (this.isLocked(index)) return;
    this.selectedIndex = index;
    this.selected.set(loc);
    // Speak location name
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(loc.name + '! Letters ' + loc.letters);
    utt.lang = 'en-US'; utt.rate = 0.85; utt.pitch = 1.2;
    speechSynthesis.speak(utt);
  }

  closeIsland() { this.selected.set(null); }

  go(mode: string) {
    const loc = this.selected();
    if (!loc) return;
    if (mode === 'story') {
      this.router.navigate(['/kids/story', loc.id]);
    } else {
      this.router.navigate(['/kids/game', loc.id, mode]);
    }
  }
}
