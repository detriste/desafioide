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

  cracha: string = ''
  senha: string = '';
  mostrarSenha: boolean = false;
  carregando: boolean = false;
  erroLogin: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {}

 

  toggleSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  login() {
    this.erroLogin = '';

   if (!this.cracha || !this.senha){
      this.erroLogin = 'Preencha todos os campos.';
      return;
    }

    this.carregando = true;

this.authService.loginAlmoxarife(this.cracha, this.senha)
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
          this.erroLogin = err.error?.erro || 'Crachá ou senha incorretos.';
        }
      });
  }
} // ✅ FECHAMENTO DA CLASSE