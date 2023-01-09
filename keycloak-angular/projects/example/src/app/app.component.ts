import { Component } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;
  public token: string;

  constructor(private readonly keycloak: KeycloakService) {}

  public async ngOnInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();

    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
    }
  }

  public login() {
    this.keycloak.login({
      acr: {
        values: ['normal'],
        essential: true
      }
    });
  }

  public logout() {
    this.keycloak.logout();
  }

  public transfer() {
    this.keycloak.login({
      acr: {
        values: ['transfer'],
        essential: true
      }
    })
  }

  public async printToken() {
    this.token = JSON.stringify(this.keycloak.getKeycloakInstance().idTokenParsed, null, 2);
  }
}
