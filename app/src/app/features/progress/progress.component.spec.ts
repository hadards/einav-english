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
    expect(component.allLessons.length).toBe(54);
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

  it('levelStats() returns correct counts for all levels summing to 54', () => {
    const stats = component.levelStats();
    const total = stats['A2'].total + stats['B1'].total + stats['B2'].total;
    expect(total).toBe(54);
    expect(stats['A2'].total).toBeGreaterThan(0);
  });

  it('levelStats() returns 0 pct when no lessons completed', () => {
    const stats = component.levelStats();
    expect(stats['A2'].pct).toBe(0);
    expect(stats['B1'].pct).toBe(0);
    expect(stats['B2'].pct).toBe(0);
  });

  it('streak should be 0 (stub)', () => {
    expect(component.streak).toBe(0);
  });
});
