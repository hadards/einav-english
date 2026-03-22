import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KIDS_LOCATIONS, loadKidsProgress, saveKidsProgress, KidsWord } from './kids.data';

type StoryPhase = 'intro' | 'letter' | 'word' | 'collect' | 'done';

@Component({
  selector: 'app-kids-story',
  standalone: true,
  imports: [CommonModule],
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
      transition: transform 0.12s ease, box-shadow 0.12s ease;
      box-shadow: 0 6px 0 rgba(0,0,0,0.25);
    }
    .tap-btn:hover { transform: translateY(-3px); box-shadow: 0 9px 0 rgba(0,0,0,0.2); }
    .tap-btn:active { transform: translateY(3px); box-shadow: 0 2px 0 rgba(0,0,0,0.2); }

    .xp-float {
      animation: xpFloat 1s ease forwards;
      pointer-events: none;
    }
    @keyframes xpFloat {
      from { opacity:1; transform: translateY(0); }
      to   { opacity:0; transform: translateY(-60px); }
    }
  `],
  template: `
    <div class="scene-bg flex flex-col" [style.background]="sceneBg()">

      <!-- Top bar -->
      <div class="px-4 pt-4 pb-3 flex items-center gap-3">
        <button (click)="goBack()" class="tap-btn flex items-center justify-center rounded-2xl w-12 h-12"
          style="background:rgba(255,255,255,0.9);font-size:20px;border:none;cursor:pointer">←</button>
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
            <span style="font-family:'Press Start 2P',monospace;font-size:14px;color:#fbbf24;text-shadow:2px 2px 0 rgba(0,0,0,0.4)">+10 XP!</span>
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
            style="background:linear-gradient(135deg,#fbbf24,#f59e0b);font-family:'Nunito',sans-serif;font-size:20px;border:none;cursor:pointer">
            LET'S GO! 🚀
          </button>
        </div>
      }

      <!-- LETTER phase -->
      @if (phase() === 'letter' && currentWord()) {
        <div class="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <div class="letter-pop w-40 h-40 rounded-3xl flex items-center justify-center"
            style="background:rgba(255,255,255,0.95);box-shadow:0 8px 0 rgba(0,0,0,0.2)">
            <span style="font-family:'Press Start 2P',monospace;font-size:72px;color:#6366f1;line-height:1">
              {{ currentWord()!.letter }}
            </span>
          </div>
          <p style="font-family:'Nunito',sans-serif;font-size:22px;color:white;font-weight:900;text-shadow:2px 2px 0 rgba(0,0,0,0.2)">
            {{ currentWord()!.letter }} is for...
          </p>
          <button (click)="advanceToWord()" class="tap-btn px-8 py-4 rounded-2xl text-white font-black"
            style="background:linear-gradient(135deg,#6366f1,#8b5cf6);font-family:'Nunito',sans-serif;font-size:20px;border:none;cursor:pointer">
            What is it? 👀
          </button>
        </div>
      }

      <!-- WORD phase -->
      @if (phase() === 'word' && currentWord()) {
        <div class="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
          <div class="emoji-bounce w-44 h-44 rounded-3xl flex items-center justify-center"
            style="background:rgba(255,255,255,0.95);box-shadow:0 8px 0 rgba(0,0,0,0.2)">
            <span style="font-size:90px;line-height:1">{{ currentWord()!.emoji }}</span>
          </div>
          <div class="word-spell flex gap-1 justify-center flex-wrap">
            @for (ch of wordChars(); track $index; let i = $index) {
              <span class="w-12 h-14 rounded-xl flex items-center justify-center font-black"
                [style.animation-delay]="i*80+'ms'"
                [style.background]="ch === currentWord()!.letter ? '#fbbf24' : 'rgba(255,255,255,0.9)'"
                style="font-family:'Press Start 2P',monospace;font-size:18px;color:#1a1a2e;box-shadow:0 4px 0 rgba(0,0,0,0.2)">
                {{ ch }}
              </span>
            }
          </div>
          <button (click)="speakAndAdvance()" class="tap-btn px-8 py-4 rounded-2xl text-white font-black"
            style="background:linear-gradient(135deg,#10b981,#059669);font-family:'Nunito',sans-serif;font-size:20px;border:none;cursor:pointer">
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
                class="collect-chip w-16 h-16 rounded-2xl flex items-center justify-center font-black transition-all"
                [style.animation-delay]="i*60+'ms'"
                [style.background]="collectedLetters()[i] ? '#fbbf24' : 'rgba(255,255,255,0.9)'"
                [style.transform]="collectedLetters()[i] ? 'scale(1.15)' : 'scale(1)'"
                style="font-family:'Press Start 2P',monospace;font-size:20px;color:#1a1a2e;border:none;cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,0.2)">
                {{ ch }}
              </button>
            }
          </div>
          @if (allCollected()) {
            <button (click)="nextWord()" class="tap-btn px-8 py-4 rounded-2xl text-white font-black"
              style="background:linear-gradient(135deg,#f43f5e,#e11d48);font-family:'Nunito',sans-serif;font-size:20px;border:none;cursor:pointer">
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
          <p style="font-family:'Nunito',sans-serif;font-size:18px;color:rgba(255,255,255,0.9)">
            You learned {{ totalWords() }} new words!
          </p>
          <div class="flex gap-3">
            <button (click)="goToGame()" class="tap-btn px-6 py-4 rounded-2xl text-white font-black"
              style="background:linear-gradient(135deg,#6366f1,#8b5cf6);font-family:'Nunito',sans-serif;font-size:17px;border:none;cursor:pointer">
              Play Game! ⚡
            </button>
            <button (click)="goBack()" class="tap-btn px-6 py-4 rounded-2xl font-black"
              style="background:rgba(255,255,255,0.9);font-family:'Nunito',sans-serif;font-size:17px;border:none;cursor:pointer;color:#1a1a2e">
              Map 🗺️
            </button>
          </div>
        </div>
      }

    </div>
  `,
})
export class KidsStoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly phase = signal<StoryPhase>('intro');
  readonly wordIndex = signal(0);
  readonly collectedLetters = signal<boolean[]>([]);
  readonly showXp = signal(false);

  private locationId = '';

  ngOnInit() {
    this.locationId = this.route.snapshot.paramMap.get('locationId') ?? '';
    this.phase.set('intro');
  }

  readonly location = computed(() =>
    KIDS_LOCATIONS.find(l => l.id === this.locationId) ?? null
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

  readonly sceneBg = computed(() => {
    const loc = this.location();
    if (!loc) return '#1a1a2e';
    return `linear-gradient(160deg, ${loc.bgFrom}, ${loc.bgTo})`;
  });

  startStory() {
    this.wordIndex.set(0);
    this.phase.set('letter');
    this.speak(this.currentWord()!.letter);
  }

  advanceToWord() {
    this.phase.set('word');
    this.speak(this.currentWord()!.audioWord);
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
      setTimeout(() => this.speak(this.currentWord()!.letter), 50);
    }
  }

  private markLocationComplete() {
    const p = loadKidsProgress();
    if (!p.completedLocations.includes(this.locationId)) {
      p.completedLocations.push(this.locationId);
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
    } catch { /* ignore */ }
  }

  goBack() { this.router.navigate(['/kids']); }

  goToGame() {
    this.router.navigate(['/kids/game', this.locationId, 'tap']);
  }
}
