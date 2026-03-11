import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SessionHeaderComponent } from './session-header.component';

describe('SessionHeaderComponent', () => {
  let fixture: ComponentFixture<SessionHeaderComponent>;
  let component: SessionHeaderComponent;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [SessionHeaderComponent] });
    fixture = TestBed.createComponent(SessionHeaderComponent);
    fixture.componentRef.setInput('sessionId', 'ABC123');
    fixture.componentRef.setInput('sessionName', 'Sprint 1');
    fixture.componentRef.setInput('votingSystem', 'fibonacci');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('defaults isHost to false', () => {
    expect(component.isHost()).toBe(false);
  });

  it('emits leave event when leave output is triggered', () => {
    let emitted = false;
    component.leave.subscribe(() => (emitted = true));
    component.leave.emit();
    expect(emitted).toBe(true);
  });
});
