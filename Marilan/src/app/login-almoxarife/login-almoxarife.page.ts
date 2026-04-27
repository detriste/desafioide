import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

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

    // Simulação de autenticação — substitua pela chamada real à API
    setTimeout(() => {
      this.carregando = false;
      // Credenciais de exemplo para teste
      if (this.cpf === '000.000.000-00' && this.senha === '1234') {
        this.router.navigateByUrl('/almoxarife', { replaceUrl: true });
      } else {
        this.erroLogin = 'CPF ou senha incorretos.';
      }
    }, 1000);
  }
}