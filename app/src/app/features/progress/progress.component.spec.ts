import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProgressComponent } from './progress.component';
import { SyllabusService } from '../../core/services/syllabus.service';

describe('ProgressComponent', () => {
  let fixture: ComponentFixture<ProgressComponent>;
  let component: ProgressComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressComponent],
      providers: [
        provideRouter([]),
        SyllabusService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all 54 lessons', () => {
    expect(component.allLessons().length).toBe(54);
  });

  it('should show 0% overall progress when all not_started', () => {
    expect(component.overallPct()).toBe(0);
  });

  it('should show 0 completed initially', () => {
    expect(component.completedCount()).toBe(0);
  });

  it('should suggest up to 5 lessons', () => {
    expect(component.suggestedLessons().length).toBe(5);
  });

  it('levelTotal() returns correct counts for all levels summing to 54', () => {
    const a2 = component.levelTotal('A2');
    const b1 = component.levelTotal('B1');
    const b2 = component.levelTotal('B2');
    expect(a2 + b1 + b2).toBe(54);
    expect(a2).toBeGreaterThan(0);
  });

  it('levelPct() returns 0 when no lessons completed', () => {
    expect(component.levelPct('A2')).toBe(0);
    expect(component.levelPct('B1')).toBe(0);
    expect(component.levelPct('B2')).toBe(0);
  });

  it('streak should be 0 (stub)', () => {
    expect(component.streak).toBe(0);
  });
});
