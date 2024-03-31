import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { TransferService } from './transfer.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;
  public token: string;
  public donationResult: any;

  constructor(private readonly keycloak: KeycloakService, private transferService: TransferService) {}

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

  public stepUp() {
    this.keycloak.login({
      acr: {
        values: ['transfer'],
        essential: true
      }
    })
  }
  public async transfer() {

     this.transferService.donateMoney().subscribe(
      (result) => {
        console.log(result)
        this.donationResult = JSON.stringify(result)},
      (error) => {
        console.log(this.donationResult)
        this.donationResult = JSON.stringify(error.error)}
        );

  }

  public async printToken() {
    this.token = JSON.stringify(this.keycloak.getKeycloakInstance().tokenParsed, null, 2);
    console.log(this.keycloak.getKeycloakInstance().token)
  }
}
