import { JsonPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import Keycloak, { KeycloakProfile, KeycloakTokenParsed } from 'keycloak-js';
import { TransferService } from './transfer.service';

type Theme = 'dark' | 'light';

interface StepUpChallenge {
  acr: string;
}

interface Banner {
  kind: 'ok' | 'error';
  text: string;
}

const THEME_KEY = 'theme';

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    // storage can be blocked, fall back to the system preference
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

@Component({
  selector: 'app-root',
  imports: [DatePipe, JsonPipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private readonly keycloak = inject(Keycloak);
  private readonly transferService = inject(TransferService);

  protected readonly isLoggedIn = signal(false);
  protected readonly userProfile = signal<KeycloakProfile | null>(null);
  protected readonly token = signal<KeycloakTokenParsed | undefined>(undefined);
  protected readonly challenge = signal<StepUpChallenge | null>(null);
  protected readonly banner = signal<Banner | null>(null);
  protected readonly sending = signal(false);
  protected readonly copied = signal(false);
  protected readonly theme = signal<Theme>(initialTheme());

  protected readonly level = computed(() =>
    this.token()?.acr === 'transfer' ? 2 : 1
  );

  protected readonly displayName = computed(() => {
    const profile = this.userProfile();
    const fullName = [profile?.firstName, profile?.lastName]
      .filter(Boolean)
      .join(' ');
    return (
      fullName ||
      profile?.username ||
      this.token()?.['preferred_username'] ||
      ''
    );
  });

  protected readonly initials = computed(() => {
    const words = this.displayName().split(' ').filter(Boolean);
    return words
      .slice(0, 2)
      .map((word: string) => word[0].toUpperCase())
      .join('');
  });

  constructor() {
    effect(() => {
      document.documentElement.dataset['theme'] = this.theme();
    });
  }

  public async ngOnInit() {
    this.isLoggedIn.set(!!this.keycloak.authenticated);

    if (this.isLoggedIn()) {
      this.token.set(this.keycloak.tokenParsed);
      this.userProfile.set(await this.keycloak.loadUserProfile());
    }
  }

  protected login() {
    this.keycloak.login({
      acr: {
        values: ['normal'],
        essential: true
      }
    });
  }

  protected logout() {
    this.keycloak.logout();
  }

  protected donate() {
    if (this.sending()) {
      return;
    }

    this.sending.set(true);
    this.banner.set(null);
    this.challenge.set(null);

    this.transferService.donateMoney().subscribe({
      next: (result) => {
        this.sending.set(false);
        this.token.set(this.keycloak.tokenParsed);
        this.banner.set({ kind: 'ok', text: result.message });
      },
      error: (error: HttpErrorResponse) => {
        this.sending.set(false);
        const challenge = this.asChallenge(error);
        if (challenge) {
          this.challenge.set(challenge);
        } else {
          this.banner.set({ kind: 'error', text: this.describe(error) });
        }
      }
    });
  }

  protected verify(challenge: StepUpChallenge) {
    this.keycloak.login({
      acr: {
        values: [challenge.acr],
        essential: true
      }
    });
  }

  protected toggleTheme() {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage can be blocked, the choice just won't be remembered
    }
  }

  protected async copyToken() {
    try {
      await navigator.clipboard.writeText(this.keycloak.token ?? '');
    } catch {
      return;
    }
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  private asChallenge(error: HttpErrorResponse): StepUpChallenge | null {
    const acr = error.error?.acr;
    return error.status === 403 && typeof acr === 'string' ? { acr } : null;
  }

  private describe(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return "Couldn't reach the transfer service. Check that it's running.";
    }
    if (error.status === 401) {
      return 'The transfer service rejected your session. Sign in again.';
    }
    return `The transfer service returned an error (${error.status}).`;
  }
}
