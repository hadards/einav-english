import { Injectable } from '@angular/core';
import { SYLLABUS, SyllabusEntry, ContentLevel, ContentType } from '@shared/syllabus.constants';

@Injectable({ providedIn: 'root' })
export class SyllabusService {
  getAll(): SyllabusEntry[] {
    return SYLLABUS;
  }

  getByType(type: ContentType): SyllabusEntry[] {
    return SYLLABUS.filter(e => e.type === type);
  }

  getByLevel(level: ContentLevel): SyllabusEntry[] {
    return SYLLABUS.filter(e => e.level === level);
  }

  getById(id: string): SyllabusEntry | undefined {
    return SYLLABUS.find(e => e.id === id);
  }
}
