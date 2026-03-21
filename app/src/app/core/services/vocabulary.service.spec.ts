import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { VocabularyService } from './vocabulary.service';

describe('VocabularyService', () => {
  let service: VocabularyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VocabularyService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(VocabularyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load a vocab set via HttpClient', (done) => {
    const mockSet = { id: 'V-01', theme: 'Daily life & routines', level: 'A2', words: [] };

    service.getVocabSet('V-01').subscribe((set) => {
      expect(set.id).toBe('V-01');
      done();
    });

    const req = httpMock.expectOne('assets/vocabulary/V-01-daily-life.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockSet);
  });

  it('should cache the vocab set on second call', (done) => {
    const mockSet = { id: 'V-01', theme: 'Daily life & routines', level: 'A2', words: [] };

    service.getVocabSet('V-01').subscribe(() => {
      service.getVocabSet('V-01').subscribe((cached) => {
        expect(cached.id).toBe('V-01');
        httpMock.expectNone('assets/vocabulary/V-01-daily-life.json');
        done();
      });
    });

    const req = httpMock.expectOne('assets/vocabulary/V-01-daily-life.json');
    req.flush(mockSet);
  });

  it('should throw for an unknown vocab set id', () => {
    expect(() => service.getVocabSet('NONEXISTENT')).toThrowError(/unknown vocabulary set id/);
  });

  it('should remove inflight entry on HTTP error so next call retries', (done) => {
    const errorResponse = new ErrorEvent('Network error');

    service.getVocabSet('V-01').subscribe({
      error: () => {
        service.getVocabSet('V-01').subscribe((set) => {
          expect(set.id).toBe('V-01');
          done();
        });

        const retryReq = httpMock.expectOne('assets/vocabulary/V-01-daily-life.json');
        retryReq.flush({ id: 'V-01', theme: 'Daily life & routines', level: 'A2', words: [] });
      }
    });

    const failedReq = httpMock.expectOne('assets/vocabulary/V-01-daily-life.json');
    failedReq.error(errorResponse);
  });
});
