import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { SyllabusService } from '../../core/services/syllabus.service';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;

  const mockAuth = {
    isLoggedIn$: signal(true),
    currentUser$: signal(null),
    signOut: jasmine.createSpy('signOut'),
    signInWithGoogle: jasmine.createSpy(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        SyllabusService,
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start on A2 level', () => {
    expect(component.activeLevel()).toBe('A2');
  });

  it('should show A2 cards by default', () => {
    const cards = component.activeCards();
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every(c => c.level === 'A2')).toBeTrue();
  });

  it('should switch to B1 when level changed', () => {
    component.activeLevel.set('B1');
    fixture.detectChanges();
    const cards = component.activeCards();
    expect(cards.every(c => c.level === 'B1')).toBeTrue();
  });

  it('should show 0% completion when all not_started', () => {
    expect(component.completionPct()).toBe(0);
  });

  it('should have all 54 cards across all levels', () => {
    component.activeLevel.set('A2');
    const a2 = component.activeCards().length;
    component.activeLevel.set('B1');
    const b1 = component.activeCards().length;
    component.activeLevel.set('B2');
    const b2 = component.activeCards().length;
    expect(a2 + b1 + b2).toBe(54);
  });
});
