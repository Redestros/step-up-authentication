import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import Keycloak from 'keycloak-js';

import { AppComponent } from './app.component';
import { TRANSFER_API_URL } from './transfer.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let http: HttpTestingController;
  let keycloak: {
    authenticated: boolean;
    token: string;
    tokenParsed: Record<string, unknown>;
    loadUserProfile: jasmine.Spy;
    login: jasmine.Spy;
    logout: jasmine.Spy;
  };

  const text = () => fixture.nativeElement.textContent as string;
  const click = (selector: string) =>
    (fixture.nativeElement.querySelector(selector) as HTMLElement).click();

  async function render(acr: string) {
    keycloak = {
      authenticated: true,
      token: 'access-token',
      tokenParsed: {
        acr,
        preferred_username: 'red',
        azp: 'step-up-client',
        exp: 1900000000
      },
      loadUserProfile: jasmine.createSpy('loadUserProfile').and.resolveTo({
        username: 'red',
        firstName: 'Red',
        lastName: 'Alert',
        email: 'red@gmail.com'
      }),
      login: jasmine.createSpy('login'),
      logout: jasmine.createSpy('logout')
    };

    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Keycloak, useValue: keycloak }
      ]
    });

    fixture = TestBed.createComponent(AppComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('shows the standard level and the user for a normal session', async () => {
    await render('normal');

    expect(text()).toContain('Red Alert');
    expect(text()).toContain('red@gmail.com');
    expect(text()).toContain('Standard');
    expect(text()).toContain('Transfers need a one-time code.');
  });

  it('shows the transfer level once the token has the transfer acr', async () => {
    await render('transfer');

    expect(text()).toContain('Transfer');
    expect(text()).toContain('Verified with a one-time code.');
  });

  it('shows the message from the API after a donation', async () => {
    await render('transfer');

    click('.btn-primary');
    http
      .expectOne(`${TRANSFER_API_URL}/donate`)
      .flush({ message: 'You donated 100$' });
    fixture.detectChanges();

    expect(text()).toContain('You donated 100$');
  });

  it('asks for a step-up when the API answers with an acr challenge, then logs in with that acr', async () => {
    await render('normal');

    click('.btn-primary');
    http
      .expectOne(`${TRANSFER_API_URL}/donate`)
      .flush(
        { acr: 'transfer', maxAge: 0 },
        { status: 403, statusText: 'Forbidden' }
      );
    fixture.detectChanges();

    expect(text()).toContain("Verify it's you to continue");

    click('.banner-warn .btn');

    expect(keycloak.login).toHaveBeenCalledWith({
      acr: { values: ['transfer'], essential: true }
    });
  });

  it('shows an error when the transfer service cannot be reached', async () => {
    await render('normal');

    click('.btn-primary');
    http
      .expectOne(`${TRANSFER_API_URL}/donate`)
      .error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(text()).toContain("Couldn't reach the transfer service");
    expect(text()).not.toContain("Verify it's you to continue");
  });
});
