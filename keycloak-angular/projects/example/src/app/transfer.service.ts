import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TransferService {

  private url = "https://localhost:7050";
  constructor(private httpClient: HttpClient) { }

  public donateMoney() {
    return this.httpClient.post<string>(this.url + "/donate", {})
  }
}
