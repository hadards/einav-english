import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { LessonService } from './lesson.service';

describe('LessonService', () => {
  let service: LessonService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LessonService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(LessonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load a lesson via HttpClient', (done) => {
    const mockLesson = { id: 'G-01', title: 'Present simple', level: 'A2' };

    service.getLesson('G-01').subscribe((lesson) => {
      expect(lesson['id']).toBe('G-01');
      done();
    });

    const req = httpMock.expectOne('assets/lessons/G-01-present-simple.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockLesson);
  });

  it('should cache the lesson on second call', (done) => {
    const mockLesson = { id: 'G-01', title: 'Present simple', level: 'A2' };

    service.getLesson('G-01').subscribe(() => {
      // Second call — should return from cache, no new HTTP request
      service.getLesson('G-01').subscribe((cached) => {
        expect(cached['id']).toBe('G-01');
        httpMock.expectNone('assets/lessons/G-01-present-simple.json');
        done();
      });
    });

    const req = httpMock.expectOne('assets/lessons/G-01-present-simple.json');
    req.flush(mockLesson);
  });
});
