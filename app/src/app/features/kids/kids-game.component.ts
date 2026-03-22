import { Component, signal, computed, effect, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KIDS_LOCATIONS, loadKidsProgress, saveKidsProgress } from './kids.data';

type GameMode = 'tap' | 'feed' | 'speed';
type MonsterState = 'idle' | 'happy' | 'sad';
type GamePhase = 'select' | 'playing' | 'correct' | 'wrong' | 'done';

interface WordItem {
  word: string;
  emoji: string;
  letter: string;
  audioWord: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function playCorrectSound(): void {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t); osc.stop(t + 0.2);
      if (i === notes.length - 1) osc.onended = () => ctx.close();
    });
  } catch { /* ignore */ }
}

function playWrongSound(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 220;
    osc.type = 'sawtooth';
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t); osc.stop(t + 0.3);
    osc.onended = () => ctx.close();
  } catch { /* ignore */ }
}

function playBurpSound(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch { /* ignore */ }
}

function playVictoryFanfare(): void {
  try {
    const ctx = new AudioContext();
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t); osc.stop(t + 0.25);
      if (i === notes.length - 1) osc.onended = () => ctx.close();
    });
  } catch { /* ignore */ }
}

@Component({
  selector: 'app-kids-game',
  standalone: true,
  imports: [],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@700;800;900&display=swap');
    :host { display: block; }

    .world-bg { min-height: 100vh; background: linear-gradient(160deg,#1a1a2e,#16213e); }

    .game-card {
      background: rgba(255,255,255,0.08);
      border: 3px solid rgba(255,255,255,0.15);
      border-radius: 24px;
      backdrop-filter: blur(8px);
    }

    .choice-btn {
      transition: transform 0.12s ease, box-shadow 0.12s ease;
      box-shadow: 0 6px 0 rgba(0,0,0,0.4);
      cursor: pointer;
    }
    .choice-btn:hover { transform: translateY(-4px); box-shadow: 0 10px 0 rgba(0,0,0,0.3); }
    .choice-btn:active { transform: translateY(3px); box-shadow: 0 2px 0 rgba(0,0,0,0.3); }
    .choice-correct { background: #22c55e !important; border-color: #16a34a !important; animation: correctPulse 0.4s ease; }
    .choice-wrong   { background: #ef4444 !important; border-color: #dc2626 !important; animation: wrongShake 0.4s ease; }

    @keyframes correctPulse {
      0%,100% { transform: scale(1); }
      50%      { transform: scale(1.08); }
    }
    @keyframes wrongShake {
      0%,100% { transform: translateX(0); }
      25%     { transform: translateX(-8px); }
      75%     { transform: translateX(8px); }
    }

    .confetti-container {
      position: fixed; inset: 0; pointer-events: none; z-index: 100; overflow: hidden;
    }
    .confetti-piece {
      position: absolute;
      width: 12px; height: 12px;
      border-radius: 2px;
      animation: confettiFall 1s ease-in forwards;
    }
    @keyframes confettiFall {
      from { transform: translateY(-20px) rotate(0deg); opacity:1; }
      to   { transform: translateY(100vh) rotate(720deg); opacity:0; }
    }

    .score-pop {
      animation: scorePop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes scorePop {
      from { opacity:0; transform: scale(0.3) translateY(20px); }
      to   { opacity:1; transform: scale(1) translateY(0); }
    }

    .mode-btn {
      transition: transform 0.12s ease, box-shadow 0.12s ease;
      box-shadow: 0 6px 0 rgba(0,0,0,0.35);
    }
    .mode-btn:hover { transform: translateY(-3px); }
    .mode-btn:active { transform: translateY(3px); box-shadow: 0 2px 0 rgba(0,0,0,0.3); }

    .star-reveal {
      animation: starReveal 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes starReveal {
      0%   { transform: scale(0); opacity:0; }
      60%  { transform: scale(1.4); opacity:1; }
      100% { transform: scale(1); opacity:1; }
    }

    .monster-happy { animation: monsterBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
    @keyframes monsterBounce {
      0%,100% { transform: translateY(0) scale(1); }
      40%     { transform: translateY(-18px) scale(1.08); }
    }
    .monster-sad { animation: monsterShake 0.45s ease both; }
    @keyframes monsterShake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-12px); }
      40%     { transform: translateX(12px); }
      60%     { transform: translateX(-8px); }
      80%     { transform: translateX(8px); }
    }
    .feed-choice {
      border: 4px solid #000;
      box-shadow: 0 6px 0 #000;
      cursor: pointer;
      transition: transform 0.12s ease, box-shadow 0.12s ease;
      background: white;
      border-radius: 12px;
    }
    .feed-choice:hover  { transform: translateY(-4px); box-shadow: 0 10px 0 #000; }
    .feed-choice:active { transform: translateY(2px);  box-shadow: 0 2px 0 #000; }
  `],
  template: `
    @if (showConfetti()) {
      <div class="confetti-container">
        @for (p of confettiPieces; track p.id) {
          <div class="confetti-piece"
            [style.left]="p.x+'%'"
            [style.background]="p.color"
            [style.animation-delay]="p.delay+'ms'"
            [style.animation-duration]="p.dur+'ms'">
          </div>
        }
      </div>
    }

    <div class="world-bg flex flex-col">

      <!-- Top bar -->
      <div class="px-4 pt-4 pb-3 flex items-center gap-3">
        <button (click)="goBack()" class="flex items-center justify-center rounded-2xl w-12 h-12"
          style="background:rgba(255,255,255,0.12);color:white;font-size:20px;border:none;cursor:pointer">←</button>
        <div class="flex-1">
          <span style="font-family:'Press Start 2P',monospace;font-size:10px;color:white">{{ location()?.name }} — GAME</span>
        </div>
        @if (phase() === 'playing' || phase() === 'correct' || phase() === 'wrong') {
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl" style="background:rgba(251,191,36,0.2);border:2px solid #fbbf24">
            <span style="font-family:'Press Start 2P',monospace;font-size:10px;color:#fbbf24">{{ score() }}/{{ totalWords() }}</span>
          </div>
        }
      </div>

      <!-- MODE SELECT -->
      @if (phase() === 'select') {
        <div class="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <p style="font-family:'Press Start 2P',monospace;font-size:14px;color:white;text-align:center;text-shadow:2px 2px 0 rgba(0,0,0,0.4)">
            CHOOSE GAME
          </p>
          <div class="flex flex-col gap-4 w-full max-w-sm">
            <button (click)="startGame('tap')" class="mode-btn px-6 py-5 rounded-2xl text-white font-black text-left"
              style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;cursor:pointer">
              <p style="font-family:'Press Start 2P',monospace;font-size:12px;margin-bottom:6px">⚡ TAP IT</p>
              <p style="font-family:'Nunito',sans-serif;font-size:14px;opacity:0.85">Hear the word — tap the right picture!</p>
            </button>
            <button (click)="startGame('feed')" class="mode-btn px-6 py-5 rounded-2xl text-white font-black text-left"
              style="background:linear-gradient(135deg,#10b981,#059669);border:none;cursor:pointer">
              <p style="font-family:'Press Start 2P',monospace;font-size:11px;margin-bottom:6px">🐲 FEED THE MONSTER</p>
              <p style="font-family:'Nunito',sans-serif;font-size:14px;opacity:0.85">Feed the right emoji!</p>
            </button>
            <button (click)="startGame('speed')" class="mode-btn px-6 py-5 rounded-2xl text-white font-black text-left"
              style="background:linear-gradient(135deg,#f43f5e,#e11d48);border:none;cursor:pointer">
              <p style="font-family:'Press Start 2P',monospace;font-size:12px;margin-bottom:6px">⏱ SPEED RUN</p>
              <p style="font-family:'Nunito',sans-serif;font-size:14px;opacity:0.85">30 seconds — go fast!</p>
            </button>
          </div>
        </div>
      }

      <!-- TAP IT -->
      @if (isActiveGame() && currentMode() === 'tap') {
        <div class="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div class="game-card px-6 py-5 text-center w-full max-w-sm">
            <p style="font-family:'Nunito',sans-serif;font-size:16px;color:rgba(255,255,255,0.7);margin-bottom:8px">Tap the correct picture!</p>
            <button (click)="speakCurrent()" class="px-6 py-3 rounded-2xl font-black text-white"
              style="background:linear-gradient(135deg,#fbbf24,#f59e0b);font-family:'Nunito',sans-serif;font-size:22px;border:none;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,0.3)">
              🔊 {{ currentWord()?.word }}
            </button>
          </div>
          <div class="grid grid-cols-2 gap-4 w-full max-w-sm">
            @for (choice of choices(); track choice.word) {
              <button (click)="tapChoice(choice)" [disabled]="phase() !== 'playing'"
                class="choice-btn rounded-2xl flex flex-col items-center justify-center gap-2 py-5"
                [class.choice-correct]="phase() !== 'playing' && choice.word === currentWord()!.word"
                [class.choice-wrong]="phase() === 'wrong' && choice.word === tappedWrong()"
                style="background:rgba(255,255,255,0.1);border:3px solid rgba(255,255,255,0.2);cursor:pointer">
                <span style="font-size:52px;line-height:1">{{ choice.emoji }}</span>
                <span style="font-family:'Nunito',sans-serif;font-size:14px;color:white;font-weight:800">{{ choice.word }}</span>
              </button>
            }
          </div>
        </div>
      }

      <!-- FEED THE MONSTER -->
      @if (isActiveGame() && currentMode() === 'feed') {
        <div class="flex-1 flex flex-col items-center justify-center gap-4 px-4">

          <!-- Word prompt -->
          <div style="background:#1a1a2e;border:4px solid #000;box-shadow:0 6px 0 #000;border-radius:12px;padding:10px 20px;text-align:center">
            <p style="font-family:'Press Start 2P',monospace;font-size:10px;color:rgba(255,255,255,0.7);margin-bottom:6px">Feed the monster!</p>
            <button (click)="speakCurrent()"
              style="font-family:'Press Start 2P',monospace;font-size:15px;color:#ffcc00;text-shadow:2px 2px 0 #000;background:none;border:none;cursor:pointer">
              🔊 {{ currentWord()?.word }}
            </button>
          </div>

          <!-- Monster SVG -->
          <div [class]="monsterState() === 'happy' ? 'monster-happy' : monsterState() === 'sad' ? 'monster-sad' : ''">
            <svg width="154" height="170" viewBox="-8 -22 176 210" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="60" width="120" height="100" rx="8" fill="#33cc33" stroke="#000" stroke-width="4"/>
              <rect x="24" y="8"  width="112" height="72" rx="8" fill="#33cc33" stroke="#000" stroke-width="4"/>
              <polygon points="36,8 50,8 42,-16"   fill="#ff3333" stroke="#000" stroke-width="3"/>
              <polygon points="110,8 124,8 118,-16" fill="#ff3333" stroke="#000" stroke-width="3"/>
              <rect x="38" y="24" width="28" height="28" rx="4" fill="white" stroke="#000" stroke-width="3"/>
              <rect x="94" y="24" width="28" height="28" rx="4" fill="white" stroke="#000" stroke-width="3"/>
              <rect x="47" y="32" width="12" height="12" rx="2" fill="#000"/>
              <rect x="103" y="32" width="12" height="12" rx="2" fill="#000"/>
              <rect x="49" y="33" width="4" height="4" rx="1" fill="white"/>
              <rect x="105" y="33" width="4" height="4" rx="1" fill="white"/>
              <path [attr.d]="monsterFaceD()" stroke="#000" stroke-width="4" fill="none" stroke-linecap="round"/>
              @if (monsterMouthOpen()) {
                <rect x="62" y="58" width="12" height="10" rx="2" fill="white" stroke="#000" stroke-width="2"/>
                <rect x="78" y="58" width="12" height="10" rx="2" fill="white" stroke="#000" stroke-width="2"/>
              }
              <rect x="-4"  y="70" width="28" height="16" rx="6" fill="#33cc33" stroke="#000" stroke-width="4"/>
              <rect x="136" y="70" width="28" height="16" rx="6" fill="#33cc33" stroke="#000" stroke-width="4"/>
              <rect x="36"  y="152" width="32" height="24" rx="6" fill="#1a9a1a" stroke="#000" stroke-width="4"/>
              <rect x="92"  y="152" width="32" height="24" rx="6" fill="#1a9a1a" stroke="#000" stroke-width="4"/>
              <rect x="58" y="80" width="16" height="16" rx="4" fill="#22aa22" stroke="#000" stroke-width="2"/>
              <rect x="86" y="90" width="12" height="12" rx="3" fill="#22aa22" stroke="#000" stroke-width="2"/>
            </svg>
          </div>

          <!-- 4 Emoji choices (2x2 grid) -->
          <div class="grid grid-cols-2 gap-4 w-full max-w-xs">
            @for (choice of choices(); track choice.word) {
              <button (click)="tapFeedChoice(choice)" [disabled]="phase() !== 'playing'"
                class="feed-choice flex flex-col items-center justify-center gap-1 py-4">
                <span style="font-size:56px;line-height:1">{{ choice.emoji }}</span>
              </button>
            }
          </div>

        </div>
      }

      <!-- SPEED RUN -->
      @if (isActiveGame() && currentMode() === 'speed') {
        <div class="flex-1 flex flex-col items-center justify-center gap-5 px-4">
          <div class="flex items-center gap-3">
            <span style="font-size:28px">⏱</span>
            <span style="font-family:'Press Start 2P',monospace;font-size:28px"
              [style.color]="timeLeft() <= 10 ? '#f43f5e' : '#fbbf24'">
              {{ timeLeft() }}
            </span>
          </div>
          <div class="game-card px-6 py-4 text-center w-full max-w-sm">
            <button (click)="speakCurrent()"
              style="font-family:'Nunito',sans-serif;font-size:24px;color:white;font-weight:900;background:none;border:none;cursor:pointer">
              🔊 {{ currentWord()?.word }}
            </button>
          </div>
          <div class="grid grid-cols-2 gap-3 w-full max-w-sm">
            @for (choice of choices(); track choice.word) {
              <button (click)="tapChoice(choice)" [disabled]="phase() !== 'playing'"
                class="choice-btn rounded-2xl py-4 flex flex-col items-center gap-1"
                [class.choice-correct]="phase() !== 'playing' && choice.word === currentWord()!.word"
                [class.choice-wrong]="phase() === 'wrong' && choice.word === tappedWrong()"
                style="background:rgba(255,255,255,0.1);border:3px solid rgba(255,255,255,0.2);cursor:pointer">
                <span style="font-size:44px;line-height:1">{{ choice.emoji }}</span>
                <span style="font-family:'Nunito',sans-serif;font-size:13px;color:white;font-weight:800">{{ choice.word }}</span>
              </button>
            }
          </div>
        </div>
      }

      <!-- DONE -->
      @if (phase() === 'done') {
        <div class="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <span style="font-size:80px" class="score-pop">{{ scoreEmoji() }}</span>
          <p style="font-family:'Press Start 2P',monospace;font-size:16px;color:white;text-shadow:2px 2px 0 rgba(0,0,0,0.4)">
            {{ score() }}/{{ totalWords() }}
          </p>
          <!-- Staggered star reveal -->
          <div class="flex gap-3 justify-center">
            @for (s of [1,2,3]; track s) {
              <span class="star-reveal" style="font-size:44px"
                [style.animation-delay]="(s-1)*300+'ms'"
                [style.opacity]="starsEarned() >= s ? '1' : '0.2'">⭐</span>
            }
          </div>
          <p style="font-family:'Nunito',sans-serif;font-size:20px;color:rgba(255,255,255,0.9);font-weight:900">
            Great job!
          </p>
          <div class="flex gap-3">
            <button (click)="phase.set('select')" class="mode-btn px-6 py-4 rounded-2xl text-white font-black"
              style="background:linear-gradient(135deg,#6366f1,#8b5cf6);font-family:'Nunito',sans-serif;font-size:16px;border:none;cursor:pointer">
              Play Again
            </button>
            <button (click)="goBack()" class="mode-btn px-6 py-4 rounded-2xl font-black"
              style="background:rgba(255,255,255,0.15);font-family:'Nunito',sans-serif;font-size:16px;border:none;cursor:pointer;color:white">
              Map 🗺️
            </button>
          </div>
        </div>
      }

    </div>
  `,
})
export class KidsGameComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly phase = signal<GamePhase>('select');
  readonly currentMode = signal<GameMode>('tap');
  readonly score = signal(0);
  readonly wordIndex = signal(0);
  readonly choices = signal<{ word: string; emoji: string }[]>([]);
  readonly tappedWrong = signal('');
  readonly showConfetti = signal(false);
  readonly timeLeft = signal(30);
  readonly monsterState = signal<MonsterState>('idle');
  readonly monsterFaceD = computed(() => {
    const s = this.monsterState();
    if (s === 'happy') return 'M 22 56 Q 32 70 42 56';
    if (s === 'sad')   return 'M 22 62 Q 32 50 42 62';
    return 'M 22 60 L 42 60';
  });
  readonly monsterMouthOpen = computed(() => this.monsterState() === 'happy');

  private readonly locationId = signal('');
  private shuffledWords: WordItem[] = [];
  private allWords: { word: string; emoji: string }[] = [];
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private timeouts: ReturnType<typeof setTimeout>[] = [];

  readonly confettiPieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ['#fbbf24','#f43f5e','#6366f1','#10b981','#3b82f6','#ec4899'][i % 6],
    delay: Math.random() * 400,
    dur: 800 + Math.random() * 600,
  }));

  constructor() {
    effect(() => {
      if (this.phase() === 'done') {
        this.onGameDone();
      }
    });
  }

  ngOnInit() {
    this.locationId.set(this.route.snapshot.paramMap.get('locationId') ?? '');
    const modeParam = this.route.snapshot.paramMap.get('mode') ?? '';
    this.allWords = KIDS_LOCATIONS.flatMap(l => l.words.map(w => ({ word: w.word, emoji: w.emoji })));
    if (modeParam === 'tap' || modeParam === 'feed' || modeParam === 'speed') {
      this.startGame(modeParam);
    }
  }

  ngOnDestroy() {
    this.clearTimer();
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts = [];
    speechSynthesis.cancel();
  }

  private onGameDone() {
    playVictoryFanfare();
    const score = this.score();
    const total = this.shuffledWords.length || this.totalWords();
    const stars = this.starsEarned();
    const praise = stars === 3 ? 'Amazing, you\'re a star!' : stars === 2 ? 'Well done!' : 'Keep practicing!';
    this.timeouts.push(setTimeout(() => {
      this.speak(`You scored ${score} out of ${total}! ${praise}`);
    }, 800));
  }

  readonly location = computed(() =>
    KIDS_LOCATIONS.find(l => l.id === this.locationId()) ?? null
  );

  readonly totalWords = computed(() => this.location()?.words.length ?? 0);

  readonly currentWord = computed((): WordItem | null =>
    this.shuffledWords[this.wordIndex()] ?? null
  );

  readonly isActiveGame = computed(() =>
    this.phase() === 'playing' || this.phase() === 'correct' || this.phase() === 'wrong'
  );

  readonly starsEarned = computed(() => {
    const pct = this.score() / Math.max(this.totalWords(), 1);
    if (pct >= 0.9) return 3;
    if (pct >= 0.6) return 2;
    if (pct > 0) return 1;
    return 0;
  });

  readonly scoreEmoji = computed(() => {
    const s = this.starsEarned();
    if (s === 3) return '🏆';
    if (s === 2) return '🎉';
    return '💪';
  });

  startGame(mode: GameMode) {
    const loc = this.location();
    if (!loc) return;
    this.currentMode.set(mode);
    this.score.set(0);
    this.wordIndex.set(0);
    this.shuffledWords = shuffle(loc.words.map(w => ({
      word: w.word, emoji: w.emoji, letter: w.letter, audioWord: w.audioWord,
    })));
    this.phase.set('playing');
    this.prepareQuestion();
    if (mode === 'speed') this.startTimer();
  }

  private prepareQuestion() {
    const cur = this.currentWord();
    if (!cur) return;
    const wrong = shuffle(this.allWords.filter(w => w.word !== cur.word)).slice(0, 3);
    this.choices.set(shuffle([{ word: cur.word, emoji: cur.emoji }, ...wrong]));
    this.speak(cur.audioWord);
  }

  tapChoice(choice: { word: string; emoji: string }) {
    if (this.phase() !== 'playing') return;
    const cur = this.currentWord();
    if (!cur) return;
    if (choice.word === cur.word) {
      this.score.update(s => s + 1);
      playCorrectSound();
      this.triggerConfetti();
      this.phase.set('correct');
      this.timeouts.push(setTimeout(() => this.advanceWord(), 900));
    } else {
      this.tappedWrong.set(choice.word);
      playWrongSound();
      this.phase.set('wrong');
      this.timeouts.push(setTimeout(() => this.advanceWord(), 1000));
    }
  }

  tapFeedChoice(choice: { word: string; emoji: string }) {
    if (this.phase() !== 'playing') return;
    const cur = this.currentWord();
    if (!cur) return;
    if (choice.word === cur.word) {
      this.score.update(s => s + 1);
      this.monsterState.set('happy');
      playBurpSound();
      this.triggerConfetti();
      this.phase.set('correct');
      this.timeouts.push(setTimeout(() => { this.monsterState.set('idle'); this.advanceWord(); }, 1000));
    } else {
      this.tappedWrong.set(choice.word);
      playWrongSound();
      this.monsterState.set('sad');
      this.phase.set('wrong');
      this.timeouts.push(setTimeout(() => { this.monsterState.set('idle'); this.advanceWord(); }, 1000));
    }
  }

  private advanceWord() {
    const next = this.wordIndex() + 1;
    if (next >= this.shuffledWords.length) {
      this.clearTimer();
      this.saveStars();
      this.phase.set('done');
    } else {
      this.wordIndex.set(next);
      this.phase.set('playing');
      this.prepareQuestion();
    }
  }

  private startTimer() {
    this.timeLeft.set(30);
    this.timerInterval = setInterval(() => {
      this.timeLeft.update(t => {
        if (t <= 1) {
          this.clearTimer();
          this.saveStars();
          this.phase.set('done');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  private clearTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  private triggerConfetti() {
    this.showConfetti.set(true);
    this.timeouts.push(setTimeout(() => this.showConfetti.set(false), 1500));
  }

  private saveStars() {
    const p = loadKidsProgress();
    const existing = p.locationStars[this.locationId()] ?? 0;
    p.locationStars[this.locationId()] = Math.max(existing, this.starsEarned());
    p.xp += this.score() * 10;
    if (p.xp >= p.level * 50) p.level++;
    saveKidsProgress(p);
  }

  private speak(text: string) {
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US'; utt.rate = 0.8; utt.pitch = 1.1;
    speechSynthesis.speak(utt);
  }

  speakCurrent() {
    const cur = this.currentWord();
    if (cur) this.speak(cur.audioWord);
  }

  goBack() { this.clearTimer(); speechSynthesis.cancel(); this.router.navigate(['/kids']); }
}
