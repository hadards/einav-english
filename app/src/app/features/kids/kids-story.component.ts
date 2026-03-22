import { Component, signal, computed, effect, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KIDS_LOCATIONS, loadKidsProgress, saveKidsProgress, KidsWord } from './kids.data';

type StoryPhase = 'intro' | 'letter' | 'word' | 'collect' | 'done';

@Component({
  selector: 'app-kids-story',
  standalone: true,
  imports: [],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@700;800;900&display=swap');
    :host { display: block; }

    .scene-bg { min-height: 100vh; }

    .letter-pop {
      animation: letterPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes letterPop {
      from { opacity:0; transform: scale(0.2) rotate(-15deg); }
      to   { opacity:1; transform: scale(1) rotate(0); }
    }

    .word-spell span {
      display: inline-block;
      animation: letterDrop 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes letterDrop {
      from { opacity:0; transform: translateY(-20px) scale(0.5); }
      to   { opacity:1; transform: translateY(0) scale(1); }
    }

    .emoji-bounce {
      animation: emojiBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes emojiBounce {
      0%   { transform: scale(0.3); opacity:0; }
      60%  { transform: scale(1.2); opacity:1; }
      100% { transform: scale(1); }
    }

    .collect-chip {
      animation: chipIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes chipIn {
      from { opacity:0; transform: scale(0.4) translateY(10px); }
      to   { opacity:1; transform: scale(1) translateY(0); }
    }

    .tap-btn {
      border: 4px solid #000 !important;
      box-shadow: 0 6px 0 #000, 0 8px 20px rgba(0,0,0,0.5);
      transition: transform 0.12s ease, box-shadow 0.12s ease;
    }
    .tap-btn:hover  { transform: translateY(-3px); box-shadow: 0 9px 0 #000; }
    .tap-btn:active { transform: translateY(4px);  box-shadow: 0 2px 0 #000; }

    .xp-float {
      animation: xpFloat 1s ease forwards;
      pointer-events: none;
    }
    @keyframes xpFloat {
      from { opacity:1; transform: translateY(0); }
      to   { opacity:0; transform: translateY(-60px); }
    }

    .star-pop {
      animation: starPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes starPop {
      0%   { transform: scale(0); opacity:0; }
      60%  { transform: scale(1.3); opacity:1; }
      100% { transform: scale(1); opacity:1; }
    }
  `],
  template: `
    <div class="scene-bg flex flex-col" [style.background]="'#1a1a2e'">

      <!-- Top bar -->
      <div class="px-4 pt-4 pb-3 flex items-center gap-3">
        <button (click)="goBack()" class="tap-btn flex items-center justify-center rounded-2xl w-12 h-12"
          style="background:rgba(255,255,255,0.9);font-size:20px;border:4px solid #000;cursor:pointer;box-shadow:0 4px 0 #000;border-radius:8px">←</button>
        <div class="flex items-center gap-2 flex-1">
          <span style="font-size:24px">{{ location()?.emoji }}</span>
          <span style="font-family:'Press Start 2P',monospace;font-size:11px;color:white;text-shadow:2px 2px 0 rgba(0,0,0,0.3)">
            {{ location()?.name }}
          </span>
        </div>
        <span style="font-family:'Press Start 2P',monospace;font-size:10px;color:white;text-shadow:2px 2px 0 rgba(0,0,0,0.3)">
          {{ wordIndex()+1 }}/{{ totalWords() }}
        </span>
      </div>

      <!-- XP float -->
      <div class="relative" style="height:0">
        @if (showXp()) {
          <div class="xp-float absolute left-1/2 -translate-x-1/2" style="top:-20px;z-index:50">
            <span style="font-family:'Press Start 2P',monospace;font-size:14px;color:#ffcc00;text-shadow:2px 2px 0 rgba(0,0,0,0.4)">+10 XP!</span>
          </div>
        }
      </div>

      <!-- INTRO phase -->
      @if (phase() === 'intro') {
        <div class="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <span style="font-size:80px" class="emoji-bounce">{{ location()?.emoji }}</span>
          <p style="font-family:'Press Start 2P',monospace;font-size:16px;color:white;text-shadow:2px 2px 0 rgba(0,0,0,0.3)">
            Welcome to<br/>{{ location()?.name }}!
          </p>
          <p style="font-family:'Nunito',sans-serif;font-size:18px;color:rgba(255,255,255,0.9)">
            Learn letters {{ location()?.letters }} 🎉
          </p>
          <button (click)="startStory()" class="tap-btn px-8 py-4 rounded-2xl font-black text-white"
            style="background:#ffcc00;color:#1a1a2e;font-family:'Nunito',sans-serif;font-size:20px;cursor:pointer">
            LET'S GO! 🚀
          </button>
        </div>
      }

      <!-- LETTER phase -->
      @if (phase() === 'letter' && currentWord()) {
        <div class="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <div class="letter-pop w-40 h-40 flex items-center justify-center"
            style="background:#ffcc00;border:4px solid #000;box-shadow:0 8px 0 #000,0 10px 24px rgba(0,0,0,0.5);border-radius:12px">
            <span style="font-family:'Press Start 2P',monospace;font-size:72px;color:#1a1a2e;line-height:1">
              {{ currentWord()!.letter }}
            </span>
          </div>
          <p style="font-family:'Nunito',sans-serif;font-size:22px;color:white;font-weight:900;text-shadow:2px 2px 0 rgba(0,0,0,0.2)">
            {{ currentWord()!.letter }} is for...
          </p>
          <button (click)="advanceToWord()" class="tap-btn px-8 py-4 rounded-2xl text-white font-black"
            style="background:#cc33ff;font-family:'Nunito',sans-serif;font-size:20px;cursor:pointer">
            What is it? 👀
          </button>
        </div>
      }

      <!-- WORD phase -->
      @if (phase() === 'word' && currentWord()) {
        <div class="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
          <div class="emoji-bounce w-44 h-44 flex items-center justify-center"
            style="background:#3399ff;border:4px solid #000;box-shadow:0 8px 0 #000;border-radius:12px">
            <span style="font-size:90px;line-height:1">{{ currentWord()!.emoji }}</span>
          </div>
          <div class="word-spell flex gap-1 justify-center flex-wrap">
            @for (ch of wordChars(); track $index; let i = $index) {
              <span class="w-12 h-14 flex items-center justify-center font-black"
                [style.animation-delay]="i*80+'ms'"
                [style.background]="ch === currentWord()!.letter ? '#ffcc00' : 'white'"
                style="font-family:'Press Start 2P',monospace;font-size:18px;color:#1a1a2e;border:3px solid #000;box-shadow:0 4px 0 #000;border-radius:8px">
                {{ ch }}
              </span>
            }
          </div>
          <button (click)="speakAndAdvance()" class="tap-btn px-8 py-4 rounded-2xl text-white font-black"
            style="background:#33cc33;font-family:'Nunito',sans-serif;font-size:20px;cursor:pointer">
            🔊 {{ currentWord()!.word }}!
          </button>
        </div>
      }

      <!-- COLLECT phase -->
      @if (phase() === 'collect' && currentWord()) {
        <div class="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <p style="font-family:'Nunito',sans-serif;font-size:22px;color:white;font-weight:900;text-shadow:2px 2px 0 rgba(0,0,0,0.2)">
            Tap each letter! ✨
          </p>
          <div class="flex gap-3 justify-center flex-wrap">
            @for (ch of wordChars(); track $index; let i = $index) {
              <button (click)="collectLetter(i)"
                class="collect-chip w-16 h-16 flex items-center justify-center font-black transition-all"
                [style.animation-delay]="i*60+'ms'"
                [style.background]="collectedLetters()[i] ? '#ffcc00' : 'white'"
                [style.transform]="collectedLetters()[i] ? 'scale(1.15)' : 'scale(1)'"
                style="font-family:'Press Start 2P',monospace;font-size:20px;color:#1a1a2e;border:4px solid #000;cursor:pointer;box-shadow:0 5px 0 #000;border-radius:8px">
                {{ ch }}
              </button>
            }
          </div>
          @if (allCollected()) {
            <button (click)="nextWord()" class="tap-btn px-8 py-4 rounded-2xl text-white font-black"
              style="background:#ff3333;font-family:'Nunito',sans-serif;font-size:20px;cursor:pointer">
              Next! →
            </button>
          }
        </div>
      }

      <!-- DONE phase -->
      @if (phase() === 'done') {
        <div class="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <div style="font-size:80px" class="emoji-bounce">🏆</div>
          <p style="font-family:'Press Start 2P',monospace;font-size:16px;color:white;text-shadow:2px 2px 0 rgba(0,0,0,0.3)">
            AMAZING!
          </p>
          <!-- Star reveal animation -->
          <div class="flex gap-3 justify-center">
            @for (s of [1,2,3]; track s) {
              <span class="star-pop" style="font-size:48px" [style.animation-delay]="(s-1)*200+'ms'">⭐</span>
            }
          </div>
          <p style="font-family:'Nunito',sans-serif;font-size:18px;color:rgba(255,255,255,0.9)">
            You learned {{ totalWords() }} new words!
          </p>
          <div class="flex gap-3">
            <button (click)="goToGame()" class="tap-btn px-6 py-4 rounded-2xl text-white font-black"
              style="background:#6333ff;font-family:'Nunito',sans-serif;font-size:17px;cursor:pointer">
              Play Game! ⚡
            </button>
            <button (click)="goBack()" class="tap-btn px-6 py-4 font-black"
              style="background:white;border:4px solid #000;box-shadow:0 4px 0 #000;border-radius:8px;color:#1a1a2e;font-family:'Nunito',sans-serif;font-size:17px;cursor:pointer">
              Map 🗺️
            </button>
          </div>
        </div>
      }

    </div>
  `,
})
export class KidsStoryComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly phase = signal<StoryPhase>('intro');
  readonly wordIndex = signal(0);
  readonly collectedLetters = signal<boolean[]>([]);
  readonly showXp = signal(false);

  private readonly locationId = signal('');

  constructor() {
    effect(() => {
      const p = this.phase();
      const loc = this.location();
      const word = this.currentWord();
      this.speakPhase(p, loc, word);
    });
  }

  ngOnInit() {
    this.locationId.set(this.route.snapshot.paramMap.get('locationId') ?? '');
    this.phase.set('intro');
  }

  ngOnDestroy() {
    speechSynthesis.cancel();
  }

  readonly location = computed(() =>
    KIDS_LOCATIONS.find(l => l.id === this.locationId()) ?? null
  );

  readonly totalWords = computed(() => this.location()?.words.length ?? 0);

  readonly currentWord = computed((): KidsWord | null =>
    this.location()?.words[this.wordIndex()] ?? null
  );

  readonly wordChars = computed(() =>
    (this.currentWord()?.word ?? '').toUpperCase().split('')
  );

  readonly allCollected = computed(() =>
    this.collectedLetters().length > 0 && this.collectedLetters().every(Boolean)
  );

  speakPhase(phase: StoryPhase, loc: ReturnType<typeof this.location>, word: KidsWord | null) {
    if (!loc) return;
    switch (phase) {
      case 'intro':
        this.speak(`Welcome to ${loc.name}! Let's learn letters ${loc.letters}!`);
        break;
      case 'letter':
        if (word) {
          this.speak(`${word.letter} — ${word.letter} is for`);
          setTimeout(() => this.speak(word.letter), 1000);
        }
        break;
      case 'word':
        if (word) {
          setTimeout(() => this.speak(word.audioWord), 100);
        }
        break;
      case 'collect':
        this.speak('Tap each letter!');
        break;
      case 'done':
        this.playDoneJingle();
        setTimeout(() => this.speak(`Amazing! You learned ${this.totalWords()} words!`), 600);
        break;
    }
  }

  startStory() {
    this.wordIndex.set(0);
    this.phase.set('letter');
  }

  advanceToWord() {
    this.phase.set('word');
  }

  speakAndAdvance() {
    this.speak(this.currentWord()!.audioWord);
    this.collectedLetters.set(this.wordChars().map(() => false));
    setTimeout(() => this.phase.set('collect'), 400);
  }

  collectLetter(i: number) {
    const updated = [...this.collectedLetters()];
    if (updated[i]) return;
    updated[i] = true;
    this.collectedLetters.set(updated);
    this.playCollectSound();
    const letter = this.wordChars()[i];
    if (letter) this.speak(letter);
  }

  nextWord() {
    this.awardXp();
    const next = this.wordIndex() + 1;
    if (next >= this.totalWords()) {
      this.markLocationComplete();
      this.phase.set('done');
    } else {
      this.wordIndex.set(next);
      this.phase.set('letter');
    }
  }

  private markLocationComplete() {
    const p = loadKidsProgress();
    if (!p.completedLocations.includes(this.locationId())) {
      p.completedLocations.push(this.locationId());
    }
    saveKidsProgress(p);
  }

  private awardXp() {
    const p = loadKidsProgress();
    p.xp += 10;
    if (p.xp >= p.level * 50) p.level++;
    saveKidsProgress(p);
    this.showXp.set(true);
    setTimeout(() => this.showXp.set(false), 1000);
  }

  private speak(text: string) {
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 0.75;
    utt.pitch = 1.2;
    speechSynthesis.speak(utt);
  }

  private playCollectSound() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t); osc.stop(t + 0.15);
      osc.onended = () => ctx.close();
    } catch { /* ignore */ }
  }

  private playDoneJingle() {
    try {
      const ctx = new AudioContext();
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t); osc.stop(t + 0.3);
        if (i === notes.length - 1) osc.onended = () => ctx.close();
      });
    } catch { /* ignore */ }
  }

  goBack() {
    speechSynthesis.cancel();
    this.router.navigate(['/kids']);
  }

  goToGame() {
    speechSynthesis.cancel();
    this.router.navigate(['/kids/game', this.locationId(), 'tap']);
  }
}
