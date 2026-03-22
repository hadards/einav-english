import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KIDS_LOCATIONS, loadKidsProgress, saveKidsProgress } from './kids.data';

type GameMode = 'tap' | 'spell' | 'speed';
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

@Component({
  selector: 'app-kids-game',
  standalone: true,
  imports: [CommonModule],
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
            <button (click)="startGame('spell')" class="mode-btn px-6 py-5 rounded-2xl text-white font-black text-left"
              style="background:linear-gradient(135deg,#10b981,#059669);border:none;cursor:pointer">
              <p style="font-family:'Press Start 2P',monospace;font-size:12px;margin-bottom:6px">🔤 SPELL IT</p>
              <p style="font-family:'Nunito',sans-serif;font-size:14px;opacity:0.85">Tap the letters in order!</p>
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

      <!-- SPELL IT -->
      @if (isActiveGame() && currentMode() === 'spell') {
        <div class="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div class="game-card px-6 py-5 text-center w-full max-w-sm flex flex-col items-center gap-3">
            <span style="font-size:80px;line-height:1">{{ currentWord()?.emoji }}</span>
            <p style="font-family:'Nunito',sans-serif;font-size:16px;color:rgba(255,255,255,0.7)">Spell the word!</p>
            <div class="flex gap-2 justify-center">
              @for (ch of spellAnswer(); track $index) {
                <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                  [style.background]="ch ? '#fbbf24' : 'rgba(255,255,255,0.1)'"
                  style="font-family:'Press Start 2P',monospace;font-size:16px;color:#1a1a2e;border:2px solid rgba(255,255,255,0.2)">
                  {{ ch }}
                </div>
              }
            </div>
          </div>
          <div class="flex flex-wrap gap-3 justify-center max-w-xs">
            @for (letter of spellLetters(); track $index; let i = $index) {
              <button (click)="tapSpellLetter(i)" [disabled]="spellUsed()[i] || phase() !== 'playing'"
                class="choice-btn w-14 h-14 rounded-2xl flex items-center justify-center font-black"
                [style.opacity]="spellUsed()[i] ? '0.3' : '1'"
                style="background:rgba(255,255,255,0.15);border:3px solid rgba(255,255,255,0.25);cursor:pointer;font-family:'Press Start 2P',monospace;font-size:16px;color:white">
                {{ letter }}
              </button>
            }
          </div>
          @if (spellAnswer().some(c => c !== '') && phase() === 'playing') {
            <button (click)="clearSpell()"
              style="font-family:'Nunito',sans-serif;font-size:14px;color:rgba(255,255,255,0.5);background:none;border:none;cursor:pointer">
              ✕ Clear
            </button>
          }
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
          <div class="flex gap-2 justify-center">
            @for (s of [1,2,3]; track s) {
              <span style="font-size:36px" [style.opacity]="starsEarned() >= s ? '1' : '0.2'">⭐</span>
            }
          </div>
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
  readonly spellLetters = signal<string[]>([]);
  readonly spellUsed = signal<boolean[]>([]);
  readonly spellAnswer = signal<string[]>([]);

  private readonly locationId = signal('');
  private shuffledWords: WordItem[] = [];
  private allWords: { word: string; emoji: string }[] = [];
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  readonly confettiPieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ['#fbbf24','#f43f5e','#6366f1','#10b981','#3b82f6','#ec4899'][i % 6],
    delay: Math.random() * 400,
    dur: 800 + Math.random() * 600,
  }));

  ngOnInit() {
    this.locationId.set(this.route.snapshot.paramMap.get('locationId') ?? '');
    const mode = (this.route.snapshot.paramMap.get('mode') ?? 'select') as GameMode;
    this.allWords = KIDS_LOCATIONS.flatMap(l => l.words.map(w => ({ word: w.word, emoji: w.emoji })));
    if (mode !== 'select') {
      this.startGame(mode);
    }
  }

  ngOnDestroy() { this.clearTimer(); speechSynthesis.cancel(); }

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
    if (this.currentMode() === 'spell') {
      const letters = cur.word.toUpperCase().split('');
      const extra = 'AEIOUTRNS'.split('').filter(c => !letters.includes(c)).slice(0, 3);
      this.spellLetters.set(shuffle([...letters, ...extra]));
      this.spellUsed.set(new Array(letters.length + extra.length).fill(false));
      this.spellAnswer.set(new Array(letters.length).fill(''));
    }
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
      setTimeout(() => this.advanceWord(), 900);
    } else {
      this.tappedWrong.set(choice.word);
      playWrongSound();
      this.phase.set('wrong');
      setTimeout(() => this.advanceWord(), 1000);
    }
  }

  tapSpellLetter(idx: number) {
    if (this.phase() !== 'playing' || this.spellUsed()[idx]) return;
    const letter = this.spellLetters()[idx];
    const answerSlot = this.spellAnswer().findIndex(c => c === '');
    if (answerSlot === -1) return;
    const newAnswer = [...this.spellAnswer()];
    newAnswer[answerSlot] = letter;
    this.spellAnswer.set(newAnswer);
    const newUsed = [...this.spellUsed()];
    newUsed[idx] = true;
    this.spellUsed.set(newUsed);
    const cur = this.currentWord();
    if (!cur) return;
    if (newAnswer.every(c => c !== '')) {
      if (newAnswer.join('') === cur.word.toUpperCase()) {
        this.score.update(s => s + 1);
        playCorrectSound();
        this.triggerConfetti();
        this.phase.set('correct');
        setTimeout(() => this.advanceWord(), 900);
      } else {
        playWrongSound();
        this.phase.set('wrong');
        setTimeout(() => { this.clearSpell(); this.phase.set('playing'); }, 900);
      }
    }
  }

  clearSpell() {
    const cur = this.currentWord();
    if (!cur) return;
    const letters = cur.word.toUpperCase().split('');
    const extra = 'AEIOUTRNS'.split('').filter(c => !letters.includes(c)).slice(0, 3);
    this.spellUsed.set(new Array(letters.length + extra.length).fill(false));
    this.spellAnswer.set(new Array(letters.length).fill(''));
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
    setTimeout(() => this.showConfetti.set(false), 1500);
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

  goBack() { this.clearTimer(); this.router.navigate(['/kids']); }
}
