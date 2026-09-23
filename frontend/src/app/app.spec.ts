import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  DownOutline,
  ApiOutline,
  PlayCircleOutline,
  SaveOutline,
  UserOutline,
} from '@ant-design/icons-angular/icons';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNzIcons([DownOutline, ApiOutline, PlayCircleOutline, SaveOutline, UserOutline]),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    const http = TestBed.inject(HttpTestingController);
    for (const request of http.match(() => true)) {
      if (!request.cancelled) request.flush({}, { status: 503, statusText: 'Unavailable' });
    }
    http.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    for (const request of TestBed.inject(HttpTestingController).match(() => true)) {
      if (!request.cancelled) request.flush({}, { status: 503, statusText: 'Unavailable' });
    }
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the product title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Аким на 5 часов');
  });
});
