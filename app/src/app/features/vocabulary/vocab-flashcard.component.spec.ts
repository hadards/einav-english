import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VocabFlashcardComponent } from './vocab-flashcard.component';
import type { VocabSet } from '@shared/vocabulary.schema';

const mockVocabSet: VocabSet = {
  id: 'V-01',
  theme: 'Daily Life',
  level: 'A2',
  words: Array.from({ length: 15 }, (_, i) => ({
    id: `V-01-w-${String(i + 1).padStart(3, '0')}`,
    word: `word${i + 1}`,
    part_of_speech: 'noun' as const,
    definition: `Definition ${i + 1}`,
    example_sentences: [`Ex A`, `Ex B`, `Ex C`],
    pronunciation_tip: 'tip',
    common_mistake: 'mistake',
    collocations: ['col1'],
    difficulty: 1 as const,
  })),
};

describe('VocabFlashcardComponent', () => {
  let fixture: ComponentFixture<VocabFlashcardComponent>;
  let component: VocabFlashcardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VocabFlashcardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VocabFlashcardComponent);
    component = fixture.componentInstance;
    component.vocabSet = mockVocabSet;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialise with 15 cards', () => {
    expect(component.cards().length).toBe(15);
  });

  it('should start on card 0 face-front', () => {
    expect(component.currentIndex()).toBe(0);
    expect(component.face()).toBe('front');
  });

  it('flip() toggles face', () => {
    component.flip();
    expect(component.face()).toBe('back');
    component.flip();
    expect(component.face()).toBe('front');
  });

  it('markGotIt() advances and resets face', () => {
    component.flip();
    component.markGotIt();
    expect(component.currentIndex()).toBe(1);
    expect(component.face()).toBe('front');
    expect(component.cards()[0].state).toBe('got_it');
  });

  it('markSkipped() advances and marks skipped', () => {
    component.flip();
    component.markSkipped();
    expect(component.currentIndex()).toBe(1);
    expect(component.cards()[0].state).toBe('skipped');
  });

  it('done() is true after all cards advanced', () => {
    for (let i = 0; i < 15; i++) {
      component.markGotIt();
    }
    expect(component.done()).toBeTrue();
  });

  it('gotItCount() increments on markGotIt', () => {
    component.markGotIt();
    component.markGotIt();
    expect(component.gotItCount()).toBe(2);
  });

  it('retry() resets cards and index', () => {
    component.markGotIt();
    component.retry();
    expect(component.currentIndex()).toBe(0);
    expect(component.cards().every(c => c.state === 'active')).toBeTrue();
  });
});
