import { Component, signal, OnInit, OnDestroy, inject, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { KIDS_LOCATIONS, loadKidsProgress, KidsProgress } from './kids.data';

@Component({
  selector: 'app-kids-home',
  standalone: true,
  imports: [],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@700;800;900&display=swap');
    :host { display: block; }

    .map-wrap {
      min-height: 100vh;
      background: linear-gradient(175deg,#0d1b2a 0%,#1b2838 40%,#162032 100%);
      position: relative; overflow: hidden;
    }

    /* Stars */
    .star-dot {
      position: absolute; border-radius: 50%;
      background: white;
      animation: twinkle var(--d,3s) ease-in-out infinite;
      animation-delay: var(--dl,0s);
    }
    @keyframes twinkle {
      0%,100%{ opacity:.15; transform:scale(1); }
      50%    { opacity:.9;  transform:scale(1.6); }
    }

    /* Floating island */
    .node-wrap {
      position: absolute;
      transform: translate(-50%,-50%);
      cursor: pointer;
      z-index: 3;
    }
    .node-inner {
      display: flex; flex-direction: column; align-items: center;
      animation: nfloat var(--fd,2.4s) ease-in-out infinite;
      animation-delay: var(--fdl,0s);
    }
    @keyframes nfloat {
      0%,100%{ transform: translateY(0); }
      50%    { transform: translateY(-9px); }
    }

    .node-circle {
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      position: relative;
      transition: transform .18s cubic-bezier(.34,1.56,.64,1), filter .18s;
      filter: drop-shadow(0 6px 18px rgba(0,0,0,.55));
    }
    .node-circle:hover  { transform: scale(1.14); }
    .node-circle:active { transform: scale(.93); }

    /* Pulse ring */
    .pulse-ring {
      position: absolute; inset: -7px; border-radius: 50%;
      animation: pulse 2.6s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes pulse {
      0%,100%{ opacity:.5; transform:scale(1);   }
      60%    { opacity:0;  transform:scale(1.35); }
    }

    /* Lock veil */
    .lock-veil {
      position: absolute; inset:0; border-radius:50%;
      background: rgba(0,0,0,.52);
      display: flex; align-items: center; justify-content: center;
    }

    /* Labels */
    .node-label {
      margin-top: 6px; text-align: center;
      font-family: 'Press Start 2P', monospace;
      font-size: 7px; color: white;
      text-shadow: 0 1px 4px rgba(0,0,0,.9);
      white-space: nowrap;
    }
    .node-stars { display:flex; gap:2px; justify-content:center; margin-top:3px; }
    .sf { color:#fbbf24; text-shadow:0 0 6px rgba(251,191,36,.8); font-size:10px; }
    .se { color:rgba(255,255,255,.18); font-size:10px; }

    /* Popup */
    .pop-backdrop {
      position: fixed; inset:0; z-index:50;
      background: rgba(0,0,0,.68);
      backdrop-filter: blur(5px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      animation: bdin .18s ease;
    }
    @keyframes bdin { from{opacity:0} to{opacity:1} }

    .pop-card {
      width:100%; max-width:340px; border-radius:28px;
      overflow:hidden; position:relative;
      animation: popin .28s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes popin {
      from{ opacity:0; transform:scale(.65) translateY(28px); }
      to  { opacity:1; transform:scale(1)   translateY(0);    }
    }

    .act-btn {
      width:100%; border:none; cursor:pointer; border-radius:18px;
      padding: 14px 18px;
      display:flex; align-items:center; gap:14px;
      font-family:'Nunito',sans-serif;
      transition: transform .12s ease, box-shadow .12s ease;
      box-shadow: 0 5px 0 rgba(0,0,0,.3);
    }
    .act-btn:hover:not(:disabled)  { transform:translateY(-3px); box-shadow:0 8px 0 rgba(0,0,0,.25); }
    .act-btn:active:not(:disabled) { transform:translateY(2px);  box-shadow:0 2px 0 rgba(0,0,0,.25); }
    .act-btn:disabled { opacity:.38; cursor:not-allowed; box-shadow:none; }

    /* XP bar */
    .xp-fill { transition: width .6s cubic-bezier(.34,1.56,.64,1); }

    .boxy-idle {
      animation: boxyIdle 2s ease-in-out infinite;
    }
    @keyframes boxyIdle {
      0%,100%{ transform:translateY(0) rotate(0); }
      50%    { transform:translateY(-5px) rotate(2deg); }
    }
  `],
  template: `
  <div class="map-wrap">

    <!-- Star field -->
    @for (s of stars; track s.id) {
      <div class="star-dot"
        [style.left]="s.x+'%'" [style.top]="s.y+'%'"
        [style.width]="s.r+'px'" [style.height]="s.r+'px'"
        [style.--d]="s.d+'s'" [style.--dl]="s.dl+'s'">
      </div>
    }

    <!-- Top bar -->
    <div style="position:relative;z-index:10;background:rgba(0,0,0,.45);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,.08)">
      <div class="px-4 py-2 flex items-center gap-3">
        <div class="boxy-idle flex-shrink-0">
          <svg width="34" height="42" viewBox="0 0 64 80" fill="none">
            <rect x="16" y="0" width="32" height="32" rx="4" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
            <rect x="22" y="10" width="8" height="8" rx="2" fill="white"/>
            <rect x="34" y="10" width="8" height="8" rx="2" fill="white"/>
            <rect x="25" y="13" width="4" height="4" rx="1" fill="#1a1a2e"/>
            <rect x="37" y="13" width="4" height="4" rx="1" fill="#1a1a2e"/>
            <path d="M24 24 Q32 30 40 24" stroke="#B8860B" stroke-width="2" fill="none" stroke-linecap="round"/>
            <rect x="12" y="34" width="40" height="28" rx="4" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
            <rect x="0"  y="36" width="12" height="10" rx="3" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
            <rect x="52" y="36" width="12" height="10" rx="3" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
            <rect x="14" y="64" width="14" height="16" rx="3" fill="#1a1a2e"/>
            <rect x="36" y="64" width="14" height="16" rx="3" fill="#1a1a2e"/>
          </svg>
        </div>
        <div class="flex flex-col gap-1 flex-1">
          <div class="flex justify-between">
            <span style="font-family:'Press Start 2P',monospace;font-size:7px;color:rgba(255,255,255,.7)">LVL {{progress().level}}</span>
            <span style="font-family:'Press Start 2P',monospace;font-size:7px;color:#fbbf24">{{progress().xp}} XP</span>
          </div>
          <div style="height:8px;background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden;border:1px solid rgba(255,255,255,.15)">
            <div class="xp-fill h-full rounded-full" style="background:linear-gradient(90deg,#fbbf24,#f59e0b)" [style.width]="xpPct()+'%'"></div>
          </div>
        </div>
        <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:white;letter-spacing:-0.5px">ENGLISH<br>WORLD</span>
      </div>
    </div>

    <!-- Map area -->
    <div #mapArea style="position:relative; height:calc(100dvh - 58px); min-height:480px;">

      <!-- SVG path — drawn in pixel space matching island positions -->
      <svg style="position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none"
           [attr.viewBox]="'0 0 '+mapW+' '+mapH" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <marker id="dot" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="4" markerHeight="4">
            <circle cx="3" cy="3" r="2.5" fill="#fbbf24" opacity=".8"/>
          </marker>
        </defs>
        <!-- Glow backing -->
        <polyline [attr.points]="pathPoints"
          fill="none" stroke="rgba(251,191,36,.12)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Dotted gold path -->
        <polyline [attr.points]="pathPoints"
          fill="none" stroke="#fbbf24" stroke-width="3"
          stroke-dasharray="6 8" stroke-linecap="round" stroke-linejoin="round"
          opacity=".65" filter="url(#glow2)"/>
      </svg>

      <!-- Island nodes -->
      @for (loc of locations; track loc.id; let i = $index) {
        <div class="node-wrap"
          [style.left]="px(i,'x')" [style.top]="px(i,'y')"
          (click)="openIsland(loc, i)">
          <div class="node-inner"
            [style.--fd]="(2.2+i*.28)+'s'"
            [style.--fdl]="(i*.38)+'s'">

            <!-- Pulse ring (unlocked only) -->
            @if (!isLocked(i)) {
              <div class="pulse-ring" [style.background]="loc.color+'55'"></div>
            }

            <!-- Circle -->
            <div class="node-circle"
              [style.width]="sz(i)+'px'" [style.height]="sz(i)+'px'"
              [style.background]="'linear-gradient(145deg,'+loc.bgFrom+','+loc.bgTo+')'">
              @if (isLocked(i)) {
                <div class="lock-veil"><span style="font-size:20px">🔒</span></div>
              }
              <span [style.font-size]="(sz(i)*.44)+'px'" style="line-height:1;position:relative;z-index:1">{{loc.emoji}}</span>
            </div>

            <!-- Label -->
            <p class="node-label">{{loc.name}}</p>
            <div class="node-stars">
              @for (s of [1,2,3]; track s) {
                <span [class]="getStars(loc.id)>=s?'sf':'se'">★</span>
              }
            </div>
          </div>
        </div>
      }

    </div>

    <!-- Popup -->
    @if (selected()) {
      <div class="pop-backdrop" (click)="closeIsland()">
        <div class="pop-card" (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex flex-col items-center gap-2 pt-6 pb-5 px-6 text-center"
            [style.background]="'linear-gradient(135deg,'+selected()!.bgFrom+','+selected()!.bgTo+')'">
            <span style="font-size:60px;line-height:1;filter:drop-shadow(0 4px 10px rgba(0,0,0,.35))">{{selected()!.emoji}}</span>
            <p style="font-family:'Press Start 2P',monospace;font-size:13px;color:white;text-shadow:2px 2px 0 rgba(0,0,0,.3)">{{selected()!.name}}</p>
            <p style="font-family:'Nunito',sans-serif;font-size:12px;color:rgba(255,255,255,.85);font-weight:800">Letters {{selected()!.letters}}</p>
            <div style="display:flex;gap:6px">
              @for (s of [1,2,3]; track s) {
                <span [style.color]="getStars(selected()!.id)>=s?'#fbbf24':'rgba(255,255,255,.25)'"
                  [style.text-shadow]="getStars(selected()!.id)>=s?'0 0 8px rgba(251,191,36,.8)':'none'"
                  style="font-size:22px">★</span>
              }
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex flex-col gap-3 p-5" style="background:#111827">
            <button class="act-btn text-white"
              style="background:linear-gradient(135deg,#22c55e,#16a34a)"
              (click)="go('story')">
              <span style="font-size:26px">📖</span>
              <div style="text-align:left;flex:1">
                <p style="font-family:'Press Start 2P',monospace;font-size:9px;margin-bottom:3px;color:white">STORY</p>
                <p style="font-size:12px;opacity:.8;color:white">Learn the letters!</p>
              </div>
              <span style="font-size:16px;opacity:.7">▶</span>
            </button>

            @for (game of games; track game.mode) {
              <button class="act-btn"
                [style.background]="isCompleted(selected()!.id) ? game.bg : 'rgba(255,255,255,.06)'"
                [style.color]="'white'"
                [disabled]="!isCompleted(selected()!.id)"
                (click)="go(game.mode)">
                <span style="font-size:26px">{{game.icon}}</span>
                <div style="text-align:left;flex:1">
                  <p style="font-family:'Press Start 2P',monospace;font-size:9px;margin-bottom:3px;color:white">{{game.label}}</p>
                  <p style="font-size:12px;opacity:.8;color:white">{{game.desc}}</p>
                </div>
                @if (isCompleted(selected()!.id)) {
                  <span style="font-size:16px;opacity:.7">▶</span>
                } @else {
                  <span style="font-size:14px">🔒</span>
                }
              </button>
            }
          </div>

          <button (click)="closeIsland()"
            style="position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.4);border:none;color:white;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
        </div>
      </div>
    }

  </div>
  `,
})
export class KidsHomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapArea') mapAreaRef!: ElementRef<HTMLDivElement>;

  private router = inject(Router);
  readonly locations = KIDS_LOCATIONS;
  readonly progress = signal<KidsProgress>(loadKidsProgress());
  readonly selected = signal<typeof KIDS_LOCATIONS[0] | null>(null);

  // Map dimensions (updated after view init)
  mapW = 390;
  mapH = 700;

  // Node layout: positions as fractions (0–1) of map area
  // Winds from bottom-left → bottom-centre → right → upper-right → upper-centre → top-left
  private readonly nodeFrac = [
    { fx: 0.18, fy: 0.88, fs: 0.13 }, // Farm
    { fx: 0.55, fy: 0.74, fs: 0.12 }, // City
    { fx: 0.82, fy: 0.57, fs: 0.11 }, // Ocean
    { fx: 0.72, fy: 0.37, fs: 0.12 }, // Space
    { fx: 0.42, fy: 0.20, fs: 0.11 }, // Home
    { fx: 0.16, fy: 0.08, fs: 0.13 }, // Carnival
  ];

  // Computed pixel positions (set after view init)
  nodePixels: { x: number; y: number; size: number }[] = this.nodeFrac.map(() => ({ x: 0, y: 0, size: 80 }));

  // SVG polyline points string
  pathPoints = '';

  readonly stars = Array.from({ length: 55 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    r: Math.random() < 0.3 ? 2 : 1,
    d: 2 + Math.random() * 3, dl: Math.random() * 4,
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

  ngAfterViewInit() {
    // Use requestAnimationFrame to ensure layout is done
    requestAnimationFrame(() => this.recalc());
    window.addEventListener('resize', () => this.recalc());
  }

  ngOnDestroy() {
    speechSynthesis.cancel();
    window.removeEventListener('resize', () => this.recalc());
  }

  private recalc() {
    const el = this.mapAreaRef?.nativeElement;
    if (!el) return;
    this.mapW = el.clientWidth || 390;
    this.mapH = el.clientHeight || 700;
    this.nodePixels = this.nodeFrac.map(n => ({
      x: Math.round(n.fx * this.mapW),
      y: Math.round(n.fy * this.mapH),
      size: Math.round(n.fs * Math.min(this.mapW, this.mapH)),
    }));
    this.pathPoints = this.nodePixels.map(p => `${p.x},${p.y}`).join(' ');
  }

  // Template helpers
  px(i: number, axis: 'x' | 'y'): string {
    if (!this.nodePixels[i]) return '50%';
    return this.nodePixels[i][axis] + 'px';
  }
  sz(i: number): number {
    return this.nodePixels[i]?.size ?? 80;
  }

  xpPct() {
    return Math.min(100, ((this.progress().xp % 50) / 50) * 100);
  }

  isLocked(_i: number): boolean { return false; }

  isCompleted(_locationId: string): boolean { return true; } // All unlocked for testing

  getStars(locationId: string): number {
    return this.progress().locationStars[locationId] ?? 0;
  }

  private speakWelcome() {
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance('Welcome to English World! Tap an island to start!');
    utt.lang = 'en-US'; utt.rate = 0.8; utt.pitch = 1.2;
    speechSynthesis.speak(utt);
  }

  openIsland(loc: typeof KIDS_LOCATIONS[0], _i: number) {
    this.selected.set(loc);
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(loc.name + '! Letters ' + loc.letters);
    utt.lang = 'en-US'; utt.rate = 0.85; utt.pitch = 1.2;
    speechSynthesis.speak(utt);
  }

  closeIsland() { this.selected.set(null); }

  go(mode: string) {
    const loc = this.selected();
    if (!loc) return;
    if (mode === 'story') this.router.navigate(['/kids/story', loc.id]);
    else this.router.navigate(['/kids/game', loc.id, mode]);
  }
}
