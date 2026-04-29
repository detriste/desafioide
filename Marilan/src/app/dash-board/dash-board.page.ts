import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

export interface DashboardData {
  periodo: { inicio: string; fim: string };
  totais: {
    total_retiradas: number;
    total_devolucoes: number;
    total_manutencoes: number;
    total_liberacoes: number;
  };
  maisUsadas:       { nome: string; total: number }[];
  maisManutencao:   { nome: string; total: number }[];
  maisManutentores: { nome: string; area: string; total: number }[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DashboardPage implements OnInit {

  private API = 'http://localhost:3000/api';

  carregando = false;
  dados: DashboardData | null = null;

  dataInicio = '';
  dataFim    = '';

  secaoAtiva: 'uso' | 'manutencao' | 'manutentores' = 'uso';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const hoje = new Date();
    const ha30 = new Date();
    ha30.setDate(hoje.getDate() - 30);

    this.dataFim    = hoje.toISOString().slice(0, 10);
    this.dataInicio = ha30.toISOString().slice(0, 10);

    this.carregar();
  }

  carregar() {
    this.carregando = true;
    this.dados = null;

    this.http.get<DashboardData>(
      `${this.API}/dashboard?inicio=${this.dataInicio}&fim=${this.dataFim}`
    ).subscribe({
      next:  (res) => { this.dados = res; this.carregando = false; },
      error: ()    => { this.carregando = false; }
    });
  }

  barWidth(valor: number, lista: { total: number }[]): string {
    const max = Math.max(...lista.map(i => i.total), 1);
    return `${Math.round((valor / max) * 100)}%`;
  }

  // ── Navegação da navbar — blura o foco antes de navegar ──────────────────
  irPara(rota: string) {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTimeout(() => {
      this.router.navigateByUrl('/' + rota, { replaceUrl: true });
    }, 50);
  }

  sair() {
    sessionStorage.removeItem('usuario');
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }
}