import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
  let fixture: ComponentFixture<ChatComponent>;
  let component: ChatComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty messages', () => {
    expect(component.messages().length).toBe(0);
  });

  it('should not be streaming initially', () => {
    expect(component.streaming()).toBeFalse();
  });

  it('send() should not add message when inputText is empty', () => {
    component.inputText = '';
    component.send();
    expect(component.messages().length).toBe(0);
  });

  it('send() should add user message and empty assistant message', () => {
    // Mock fetch to avoid real network call
    (window as any).fetch = () => Promise.resolve({ ok: false, body: null });

    component.inputText = 'Hello!';
    component.send();

    const msgs = component.messages();
    expect(msgs.length).toBe(2);
    expect(msgs[0].role).toBe('user');
    expect(msgs[0].content).toBe('Hello!');
    expect(msgs[1].role).toBe('assistant');
  });

  it('send() should clear inputText after sending', () => {
    (window as any).fetch = () => Promise.resolve({ ok: false, body: null });
    component.inputText = 'Hi';
    component.send();
    expect(component.inputText).toBe('');
  });

  it('appendToLast() should append text to last assistant message', () => {
    component.messages.set([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
    ]);
    component.appendToLast(' there!');
    expect(component.messages()[1].content).toBe('Hi there!');
  });
});
