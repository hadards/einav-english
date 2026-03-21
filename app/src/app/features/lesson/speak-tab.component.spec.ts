import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpeakTabComponent } from './speak-tab.component';
import type { Lesson } from '@shared/lesson.schema';

const speakSentences = Array.from({ length: 5 }, (_, i) => ({
  id: `G-01-sp-${String(i + 1).padStart(3, '0')}`,
  sentence: `I run every day sentence ${i + 1}`,
  chunks: ['I run', 'every day'],
  phonetic_hints: '',
  pass_threshold: 0.7,
}));

const mockLesson: Partial<Lesson> = {
  id: 'G-01',
  title: 'Present simple',
  level: 'A2',
  explain: {
    rule: 'Use present simple for habits.',
    why_matters: 'Very common.',
    hebrew_note: 'Hebrew note.',
    tip: 'A tip.',
    good_examples: [{ id: 'e1', sentence: 'I run.', audio_text: 'I run.' }],
    bad_examples: [{ id: 'b1', wrong: 'I runs.', correct: 'I run.', reason: 'No -s for I.' }],
  },
  exercises: Array.from({ length: 20 }, (_, i) => ({
    id: `G-01-ex-${String(i + 1).padStart(3, '0')}`,
    type: 'fill_blank' as const,
    question: `Q${i + 1}`, answer: `A${i + 1}`, hint: 'hint', explanation: 'exp',
  })),
  speak: speakSentences,
};

class MockSpeechRecognition {
  lang = '';
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((e: any) => void) | null = null;
  onerror: (() => void) | null = null;
  onend: (() => void) | null = null;
  start() {}
  stop() {}
}

describe('SpeakTabComponent', () => {
  let fixture: ComponentFixture<SpeakTabComponent>;
  let component: SpeakTabComponent;

  beforeEach(async () => {
    (window as any).SpeechRecognition = MockSpeechRecognition;

    await TestBed.configureTestingModule({
      imports: [SpeakTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpeakTabComponent);
    component = fixture.componentInstance;
    component.lesson = mockLesson as Lesson;
    fixture.detectChanges();
  });

  afterEach(() => {
    delete (window as any).SpeechRecognition;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialise with 5 sentences all waiting', () => {
    const results = component.results();
    expect(results.length).toBe(5);
    expect(results.every(r => r.state === 'waiting')).toBeTrue();
  });

  it('should start on sentence index 0', () => {
    expect(component.currentIndex()).toBe(0);
  });

  it('should not be allDone initially', () => {
    expect(component.allDone()).toBeFalse();
  });

  it('skip() advances to next sentence and marks as skipped', () => {
    component.skip();
    expect(component.currentIndex()).toBe(1);
    expect(component.results()[0].state).toBe('skipped');
  });

  it('advance() increments index', () => {
    component.advance();
    expect(component.currentIndex()).toBe(1);
  });

  it('allDone() returns true after skipping all sentences', () => {
    for (let i = 0; i < 5; i++) {
      component.skip();
    }
    expect(component.allDone()).toBeTrue();
  });

  it('passedCount() reflects passed sentences after handleTranscript', () => {
    // Sentence 1: exact match → should pass (similarity = 1.0 >= 0.7)
    component.handleTranscript('I run every day sentence 1');
    component.advance();
    // Sentence 2: completely wrong → should fail
    component.handleTranscript('xyz abc');
    expect(component.passedCount()).toBe(1);
  });
});
