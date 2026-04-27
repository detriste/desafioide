import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { finalize } from 'rxjs/operators'; // ✅ IMPORTANTE

@Component({
  selector: 'app-login-almoxarife',
  templateUrl: './login-almoxarife.page.html',
  styleUrls: ['./login-almoxarife.page.scss'],
  standalone: false,
})
export class LoginAlmoxarifePage implements OnInit {

  cpf: string = '';
  senha: string = '';
  mostrarSenha: boolean = false;
  carregando: boolean = false;
  erroLogin: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {}

  formatarCpf(event: any) {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length <= 11) {
      valor = valor
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    this.cpf = valor;
  }

  toggleSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  login() {
    this.erroLogin = '';

    if (!this.cpf || !this.senha) {
      this.erroLogin = 'Preencha todos os campos.';
      return;
    }

    this.carregando = true;

    this.authService.loginAlmoxarife(this.cpf, this.senha)
      .pipe(
        finalize(() => {
          this.carregando = false;
        })
      )
      .subscribe({
        next: (res: any) => { // ✅ tipagem corrigida
          sessionStorage.setItem('usuario', JSON.stringify(res.usuario));
          this.router.navigateByUrl('/almoxarife', { replaceUrl: true });
        },
        error: (err) => {
          this.erroLogin = err.error?.erro || 'CPF ou senha incorretos.';
        }
      });
  }
} // ✅ FECHAMENTO DA CLASSE