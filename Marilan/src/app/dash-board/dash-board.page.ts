import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

export interface EmUsoItem {
  ferramenta_nome:   string;
  ferramenta_codigo: string;
  manutentor_nome:   string;
  manutentor_area:   string;
  ordem_servico:     string;
  data_retirada:     string;
}

export interface DashboardData {
  periodo: { inicio: string; fim: string };
  totais: {
    total_retiradas:   number;
    total_devolucoes:  number;
    total_manutencoes: number;
    total_liberacoes:  number;
  };
  maisUsadas:       { nome: string; total: number }[];
  maisManutencao:   { nome: string; total: number }[];
  maisManutentores: { nome: string; area: string; total: number }[];
  emUso:            EmUsoItem[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dash-board.page.html',
  styleUrls: ['./dash-board.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DashboardPage implements OnInit {

  private API = 'http://localhost:3000/api';

  carregando = false;
  dados: DashboardData | null = null;

  dataInicio: string = '';
  dataFim: string    = '';

  secaoAtiva: 'uso' | 'manutencao' | 'manutentores' | 'em_uso' = 'uso';

  usuarioLogado: any = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const raw = sessionStorage.getItem('usuario');
    if (raw) this.usuarioLogado = JSON.parse(raw);

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

    const params = `inicio=${this.dataInicio}&fim=${this.dataFim}`;

    this.http.get<DashboardData>(`${this.API}/dashboard?${params}`).subscribe({
      next: (res) => {
        this.dados = res;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      }
    });
  }

  // ✅ Método auxiliar — usado no HTML para evitar TS2532
  // Garante que dados e emUso existem e têm itens antes de renderizar
  temEmUso(): boolean {
    return !!(this.dados && this.dados.emUso && this.dados.emUso.length > 0);
  }

  barWidth(valor: number, lista: { total: number }[]): string {
    const max = Math.max(...lista.map(i => i.total), 1);
    return `${Math.round((valor / max) * 100)}%`;
  }

  diasEmUso(dataRetirada: string): number {
    const retirada = new Date(dataRetirada);
    const hoje     = new Date();
    const diff     = hoje.getTime() - retirada.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  corDias(dias: number): string {
    if (dias >= 7) return 'danger';
    if (dias >= 3) return 'warning';
    return 'success';
  }

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