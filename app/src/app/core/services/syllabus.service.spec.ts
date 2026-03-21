import { TestBed } from '@angular/core/testing';
import { SyllabusService } from './syllabus.service';

describe('SyllabusService', () => {
  let service: SyllabusService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SyllabusService] });
    service = TestBed.inject(SyllabusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all 54 syllabus entries', () => {
    const entries = service.getAll();
    expect(entries.length).toBe(54);
  });

  it('should return 36 grammar lessons', () => {
    const grammar = service.getByType('grammar');
    expect(grammar.length).toBe(36);
  });

  it('should return 18 vocabulary sets', () => {
    const vocab = service.getByType('vocabulary');
    expect(vocab.length).toBe(18);
  });

  it('should return entries filtered by level', () => {
    const a2 = service.getByLevel('A2');
    expect(a2.length).toBeGreaterThan(0);
    expect(a2.every(e => e.level === 'A2')).toBeTrue();
  });

  it('should find a single entry by id', () => {
    const entry = service.getById('G-01');
    expect(entry).toBeDefined();
    expect(entry!.title).toBe('Present simple');
  });
});
