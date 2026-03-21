import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { LessonPlayerComponent } from './lesson-player.component';
import { LessonService } from '../../core/services/lesson.service';
import { of } from 'rxjs';

const mockLesson = {
  id: 'G-01', title: 'Present simple', level: 'A2' as const, order: 1,
  explain: {
    rule: 'Use present simple for habits.', why_matters: 'Common.',
    hebrew_note: 'Note.', tip: 'Tip.',
    good_examples: [{ id: 'e1', sentence: 'I run.', audio_text: 'I run.' }],
    bad_examples: [{ id: 'b1', wrong: 'I runs.', correct: 'I run.', reason: 'No -s for I.' }],
  },
  exercises: Array.from({ length: 20 }, (_, i) => ({
    id: `G-01-ex-${String(i+1).padStart(3,'0')}`,
    type: 'fill_blank' as const,
    question: `Q${i+1}`, answer: `A${i+1}`, hint: 'hint', explanation: 'exp',
  })),
  speak: [{ id: 'sp1', sentence: 'I run.', chunks: ['I run.'], phonetic_hints: '', pass_threshold: 0.7 }],
};

describe('LessonPlayerComponent', () => {
  let fixture: ComponentFixture<LessonPlayerComponent>;
  let component: LessonPlayerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonPlayerComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'G-01' } } } },
        { provide: LessonService, useValue: { getLesson: () => of(mockLesson) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load lesson and show title', () => {
    expect(component.lesson()?.title).toBe('Present simple');
    expect(component.loading()).toBeFalse();
  });

  it('should start on explain tab', () => {
    expect(component.activeTab()).toBe('explain');
  });

  it('should lock speak tab initially', () => {
    expect(component.practiceUnlocked()).toBeFalse();
  });

  it('should unlock speak when score >= 0.7', () => {
    component.onPracticeComplete(0.75);
    expect(component.practiceUnlocked()).toBeTrue();
  });

  it('should NOT unlock speak when score < 0.7', () => {
    component.onPracticeComplete(0.5);
    expect(component.practiceUnlocked()).toBeFalse();
  });
});
