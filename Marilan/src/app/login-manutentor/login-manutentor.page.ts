import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login-manutentor',
  templateUrl: './login-manutentor.page.html',
  styleUrls: ['./login-manutentor.page.scss'],
  standalone: false,
})
export class LoginManutentorPage implements OnInit {

  cpf: string = '';
  senha: string = '';
  oficina: string = '';
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

    if (!this.cpf || !this.senha || !this.oficina) {
      this.erroLogin = 'Preencha todos os campos.';
      return;
    }

    this.carregando = true;

    this.authService.loginManutentor(this.cpf, this.senha, this.oficina).subscribe({
      next: (res) => {
        this.carregando = false;
        // Salva o usuário na sessão
        sessionStorage.setItem('usuario', JSON.stringify(res.usuario));
        this.router.navigateByUrl('/manutentores', { replaceUrl: true });
      },
      error: (err) => {
        this.carregando = false;
        this.erroLogin = err.error?.erro || 'CPF, senha ou oficina incorretos.';
      }
    });
  }
}