import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

 loginManutentor(cracha: string, senha: string, oficina: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/manutentor`, { cracha, senha, oficina });
  }

  loginAlmoxarife(cracha: string, senha: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/almoxarife`, { cracha, senha });
  }
}