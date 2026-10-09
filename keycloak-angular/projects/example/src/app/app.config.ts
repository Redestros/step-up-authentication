import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  includeBearerTokenInterceptor,
  provideKeycloak
} from 'keycloak-angular';

import { TRANSFER_API_URL } from './transfer.service';

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const appConfig: ApplicationConfig = {
  providers: [
    provideKeycloak({
      config: {
        realm: 'step-up',
        url: 'http://localhost:8080',
        clientId: 'step-up-client'
      },
      initOptions: {
        onLoad: 'login-required',
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html'
      }
    }),
    // The bearer token is only sent to the URLs listed here, so it never leaks to other hosts.
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [
        {
          urlPattern: new RegExp(
            `^${escapeRegExp(TRANSFER_API_URL)}(/.*)?$`,
            'i'
          )
        }
      ]
    },
    provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
    provideZoneChangeDetection(),
    provideRouter([])
  ]
};
