import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export const TRANSFER_API_URL = "https://localhost:7050";

@Injectable({
  providedIn: 'root'
})
export class TransferService {

  private url = TRANSFER_API_URL;
  private httpClient = inject(HttpClient);

  public donateMoney() {
    return this.httpClient.post<string>(this.url + "/donate", {})
  }
}
