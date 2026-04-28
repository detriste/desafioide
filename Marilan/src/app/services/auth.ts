import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  loginManutentor(cpf: string, senha: string, oficina: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/manutentor`, { cpf, senha, oficina });
  }

  loginAlmoxarife(cpf: string, senha: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/almoxarife`, { cpf, senha });
  }
}