import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';

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

private API = '/api';

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

  exportarExcel() {
    if (!this.dados) {
      alert('Carregue os dados antes de exportar.');
      return;
    }

    const wb = XLSX.utils.book_new();
    const periodo = `${this.dataInicio} até ${this.dataFim}`;

    const montarSheet = (titulo: string, subtitulo: string, cabecalho: string[], linhas: any[][]) => {
      const todasLinhas: any[][] = [
        [titulo],
        [subtitulo],
        [],
        cabecalho,
        ...linhas,
      ];

      const ws: any = {};
      const range = { s: { r: 0, c: 0 }, e: { r: todasLinhas.length - 1, c: cabecalho.length - 1 } };

      todasLinhas.forEach((linha, rowIdx) => {
        linha.forEach((valor: any, colIdx: number) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
          const cell: any = { v: valor ?? '', t: typeof valor === 'number' ? 'n' : 's' };

          if (rowIdx === 0) {
            cell.s = {
              font: { bold: true, sz: 14, color: { rgb: 'C85A00' } },
              alignment: { horizontal: 'left' }
            };
          } else if (rowIdx === 1) {
            cell.s = {
              font: { italic: true, sz: 11, color: { rgb: '888888' } }
            };
          } else if (rowIdx === 3) {
            cell.s = {
              font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
              fill: { patternType: 'solid', fgColor: { rgb: 'C85A00' } },
              alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
              border: {
                top:    { style: 'thin', color: { rgb: '999999' } },
                bottom: { style: 'thin', color: { rgb: '999999' } },
                left:   { style: 'thin', color: { rgb: '999999' } },
                right:  { style: 'thin', color: { rgb: '999999' } },
              }
            };
          } else if (rowIdx > 3) {
            const par = rowIdx % 2 === 0;
            cell.s = {
              fill: par
                ? { patternType: 'solid', fgColor: { rgb: 'FEF0E6' } }
                : { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
              alignment: { horizontal: colIdx === 0 ? 'center' : 'left', vertical: 'center' },
              border: {
                top:    { style: 'thin', color: { rgb: 'DDDDDD' } },
                bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
                left:   { style: 'thin', color: { rgb: 'DDDDDD' } },
                right:  { style: 'thin', color: { rgb: 'DDDDDD' } },
              }
            };
          }

          ws[cellRef] = cell;
        });
      });

      ws['!ref'] = XLSX.utils.encode_range(range);
      return ws;
    };

    // ── ABA 1: RESUMO GERAL ────────────────────────────────────────────────
    const wsResumo = montarSheet(
      'DASHBOARD - CONTROLE DE FERRAMENTAS',
      `Período: ${periodo}`,
      ['MÉTRICA', 'QUANTIDADE', 'DESCRIÇÃO'],
      [
        ['Retiradas no período',     this.dados.totais.total_retiradas,   'Total de ferramentas retiradas'],
        ['Devoluções no período',    this.dados.totais.total_devolucoes,  'Total de ferramentas devolvidas'],
        ['Envios para manutenção',   this.dados.totais.total_manutencoes, 'Total enviadas para manutenção'],
        ['Liberações de manutenção', this.dados.totais.total_liberacoes,  'Total liberadas após manutenção'],
        ['Em uso agora',             this.dados.emUso.length,             'Ferramentas ainda não devolvidas'],
      ]
    );
    wsResumo['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 38 }];
    wsResumo['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Geral');

    // ── ABA 2: MAIS RETIRADAS ──────────────────────────────────────────────
    const linhasMaisUsadas = this.dados.maisUsadas.length > 0
      ? this.dados.maisUsadas.map((item, i) => [`${i + 1}°`, item.nome, item.total])
      : [['—', 'Nenhuma retirada no período', 0]];

    const wsMaisUsadas = montarSheet(
      'FERRAMENTAS MAIS RETIRADAS NO PERÍODO',
      `Período: ${periodo}`,
      ['POSIÇÃO', 'NOME DA FERRAMENTA', 'TOTAL DE RETIRADAS'],
      linhasMaisUsadas
    );
    wsMaisUsadas['!cols'] = [{ wch: 12 }, { wch: 52 }, { wch: 20 }];
    wsMaisUsadas['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsMaisUsadas, 'Mais Retiradas');

    // ── ABA 3: MANUTENÇÕES ─────────────────────────────────────────────────
    const linhasManutencao = this.dados.maisManutencao.length > 0
      ? this.dados.maisManutencao.map((item, i) => [`${i + 1}°`, item.nome, item.total])
      : [['—', 'Nenhuma manutenção no período', 0]];

    const wsManutencao = montarSheet(
      'FERRAMENTAS COM MAIS MANUTENCOES NO PERÍODO',
      `Período: ${periodo}`,
      ['POSIÇÃO', 'NOME DA FERRAMENTA', 'TOTAL DE MANUTENCOES'],
      linhasManutencao
    );
    wsManutencao['!cols'] = [{ wch: 12 }, { wch: 52 }, { wch: 22 }];
    wsManutencao['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsManutencao, 'Manutencoes');

    // ── ABA 4: MANUTENTORES ────────────────────────────────────────────────
    const linhasManutentores = this.dados.maisManutentores.length > 0
      ? this.dados.maisManutentores.map((item, i) => [`${i + 1}°`, item.nome, item.area ?? '—', item.total])
      : [['—', 'Nenhum dado no período', '—', 0]];

    const wsManutentores = montarSheet(
      'MANUTENTORES QUE MAIS RETIRARAM FERRAMENTAS',
      `Período: ${periodo}`,
      ['POSIÇÃO', 'NOME DO MANUTENTOR', 'ÁREA / OFICINA', 'TOTAL DE RETIRADAS'],
      linhasManutentores
    );
    wsManutentores['!cols'] = [{ wch: 12 }, { wch: 38 }, { wch: 20 }, { wch: 20 }];
    wsManutentores['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsManutentores, 'Manutentores');

    // ── ABA 5: EM USO AGORA ────────────────────────────────────────────────
    const linhasEmUso = this.dados.emUso.length > 0
      ? this.dados.emUso.map(item => {
          const dias = this.diasEmUso(item.data_retirada);
          return [
            item.ferramenta_nome   ?? '—',
            item.ferramenta_codigo ?? '—',
            item.manutentor_nome   ?? '—',
            item.manutentor_area   ?? '—',
            item.ordem_servico     ?? '—',
            item.data_retirada ? new Date(item.data_retirada).toLocaleString('pt-BR') : '—',
            dias === 0 ? 'Retirado hoje' : `${dias} dia(s)`,
          ];
        })
      : [['Todas as ferramentas foram devolvidas', '', '', '', '', '', '']];

    const wsEmUso = montarSheet(
      'FERRAMENTAS ATUALMENTE EM USO (NAO DEVOLVIDAS)',
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      ['FERRAMENTA', 'CÓDIGO', 'MANUTENTOR', 'ÁREA', 'ORDEM DE SERVIÇO', 'DATA DE RETIRADA', 'DIAS EM USO'],
      linhasEmUso
    );
    wsEmUso['!cols'] = [
      { wch: 45 }, { wch: 15 }, { wch: 28 },
      { wch: 15 }, { wch: 20 }, { wch: 22 }, { wch: 15 },
    ];
    wsEmUso['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsEmUso, 'Em Uso Agora');

    const nomeArquivo = `dashboard_marilan_${this.dataInicio}_${this.dataFim}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
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