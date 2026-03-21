import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { signal } from '@angular/core';

describe('authGuard', () => {
  const makeAuthService = (loggedIn: boolean) => ({
    isLoggedIn$: signal(loggedIn),
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { createUrlTree: (cmds: any[]) => ({ commands: cmds }) } },
        { provide: AuthService, useValue: makeAuthService(false) },
      ],
    });
  });

  it('should allow access when user is logged in', () => {
    TestBed.overrideProvider(AuthService, { useValue: makeAuthService(true) });
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBeTrue();
  });

  it('should redirect to /login when user is not logged in', () => {
    TestBed.overrideProvider(AuthService, { useValue: makeAuthService(false) });
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).not.toBeTrue();
  });
});
