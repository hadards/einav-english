import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { VocabularyComponent } from './vocabulary.component';
import { SyllabusService } from '../../core/services/syllabus.service';
import { VocabularyService } from '../../core/services/vocabulary.service';
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
    example_sentences: [`Example 1`, `Example 2`, `Example 3`],
    pronunciation_tip: 'tip',
    common_mistake: 'mistake',
    collocations: ['col1'],
    difficulty: 1 as const,
  })),
};

describe('VocabularyComponent', () => {
  let fixture: ComponentFixture<VocabularyComponent>;
  let component: VocabularyComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VocabularyComponent],
      providers: [
        provideRouter([]),
        SyllabusService,
        { provide: VocabularyService, useValue: { getVocabSet: () => of(mockVocabSet) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VocabularyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start on list view', () => {
    expect(component.view()).toBe('list');
  });

  it('should start on A2 level', () => {
    expect(component.activeLevel()).toBe('A2');
  });

  it('activeEntries() filters by level', () => {
    const a2 = component.activeEntries();
    expect(a2.every(e => e.level === 'A2')).toBeTrue();
  });

  it('openSet() switches to flashcard view', () => {
    const entry = component.activeEntries()[0];
    component.openSet(entry.id);
    expect(component.view()).toBe('flashcard');
    expect(component.activeSet()).toBeTruthy();
  });

  it('backToList() resets to list view', () => {
    component.openSet(component.activeEntries()[0].id);
    component.backToList();
    expect(component.view()).toBe('list');
    expect(component.activeSet()).toBeNull();
  });
});
