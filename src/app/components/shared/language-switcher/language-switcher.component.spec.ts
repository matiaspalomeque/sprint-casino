import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { I18nService } from '../../../services/i18n.service';

describe('LanguageSwitcherComponent', () => {
  let fixture: ComponentFixture<LanguageSwitcherComponent>;
  let component: LanguageSwitcherComponent;
  let i18n: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [LanguageSwitcherComponent] });
    i18n = TestBed.inject(I18nService);
    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('calls i18n.setLocale with the given locale', () => {
    component.setLocale('es-AR');
    expect(i18n.locale()).toBe('es-AR');
  });

  it('sets locale back to en', () => {
    component.setLocale('es-AR');
    component.setLocale('en');
    expect(i18n.locale()).toBe('en');
  });
});
