import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AuthService] });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose currentUser$ as a signal with initial value null', () => {
    expect(service.currentUser$()).toBeNull();
  });

  it('should expose isLoggedIn$ as a computed signal returning false when no user', () => {
    expect(service.isLoggedIn$()).toBeFalse();
  });
});
