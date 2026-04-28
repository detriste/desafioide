import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

export interface Manutentor {
  nome: string;
  area: string;
  dataRetirada?: Date;
}

export interface Ferramenta {
  id: number;
  nome: string;
  codigo: string;
  status: 'disponivel' | 'em_uso' | 'manutencao';
  quantidade: number;
  descricao: string;
  localizacao?: string;
  manutentor?: Manutentor;
}

@Component({
  selector: 'app-almoxarife',
  templateUrl: './almoxarife.page.html',
  styleUrls: ['./almoxarife.page.scss'],
  standalone: false,
})
export class AlmoxarifePage implements OnInit {

  // ── Estado dos modais ──────────────────────────────────
  modalDisponivel = false;
  modalEmUso      = false;
  modalManutencao = false;

  ferramentaSelecionada: Ferramenta | null = null;
  erroModal = '';

  novoManutentor: { nome: string; area: string } = { nome: '', area: '' };

  // ── Filtros ────────────────────────────────────────────
  termoBusca   = '';
  filtroStatus = 'todos';

  // ── Dados ──────────────────────────────────────────────
  ferramentas: Ferramenta[] = [
    {
      id: 1,
      nome: 'Chave de Fenda Phillips',
      codigo: 'CFP-001',
      status: 'disponivel',
      quantidade: 5,
      descricao: 'Chave de fenda Phillips tamanho 2, cabo emborrachado antiderrapante.',
      localizacao: 'Prateleira A1',
    },
    {
      id: 2,
      nome: 'Alicate Universal',
      codigo: 'ALU-002',
      status: 'em_uso',
      quantidade: 3,
      descricao: 'Alicate universal 8" com cabo isolado 1000V.',
      localizacao: 'Prateleira A2',
      manutentor: {
        nome: 'Carlos Silva',
        area: 'ELE',
        dataRetirada: new Date(Date.now() - 1000 * 60 * 95), // ~1h35min atrás
      },
    },
    {
      id: 3,
      nome: 'Multímetro Digital',
      codigo: 'MTD-003',
      status: 'em_uso',
      quantidade: 2,
      descricao: 'Multímetro digital com medição de tensão AC/DC, corrente e resistência.',
      localizacao: 'Armário B3',
      manutentor: {
        nome: 'João Pereira',
        area: 'ELE',
        dataRetirada: new Date(Date.now() - 1000 * 60 * 30), // ~30min atrás
      },
    },
    {
      id: 4,
      nome: 'Chave Inglesa 12"',
      codigo: 'CHI-004',
      status: 'manutencao',
      quantidade: 2,
      descricao: 'Chave inglesa ajustável 12 polegadas, aço cromo vanádio.',
      localizacao: 'Prateleira C1',
    },
    {
      id: 5,
      nome: 'Furadeira de Impacto',
      codigo: 'FUI-005',
      status: 'disponivel',
      quantidade: 1,
      descricao: 'Furadeira de impacto 750W, mandril 13mm, bivolt.',
      localizacao: 'Armário D2',
    },
    {
      id: 6,
      nome: 'Torquímetro',
      codigo: 'TRQ-006',
      status: 'em_uso',
      quantidade: 1,
      descricao: 'Torquímetro de estalo 1/2", range 28-210 N.m.',
      localizacao: 'Armário B1',
      manutentor: {
        nome: 'André Oliveira',
        area: 'MEC',
        dataRetirada: new Date(Date.now() - 1000 * 60 * 200), // ~3h20min atrás
      },
    },
    {
      id: 7,
      nome: 'Esmerilhadeira Angular',
      codigo: 'ESM-007',
      status: 'disponivel',
      quantidade: 2,
      descricao: 'Esmerilhadeira angular 4.5" 820W com proteção lateral.',
      localizacao: 'Prateleira E3',
    },
    {
      id: 8,
      nome: 'Chave de Grifo',
      codigo: 'CHG-008',
      status: 'em_uso',
      quantidade: 2,
      descricao: 'Chave de grifo 10" para tubulações, aço forjado.',
      localizacao: 'Prateleira A3',
      manutentor: {
        nome: 'Ricardo Souza',
        area: 'MME',
        dataRetirada: new Date(Date.now() - 1000 * 60 * 15), // ~15min atrás
      },
    },
    {
      id: 9,
      nome: 'Manômetro de Pressão',
      codigo: 'MNM-009',
      status: 'manutencao',
      quantidade: 1,
      descricao: 'Manômetro analógico 0-16 bar, conexão 1/4" NPT.',
      localizacao: 'Armário F1',
    },
  ];

  ferramentasFiltradas: Ferramenta[] = [];

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.ferramentasFiltradas = [...this.ferramentas];
  }

  // ── Filtro ─────────────────────────────────────────────
  filtrar() {
    const termo = this.termoBusca.toLowerCase().trim();
    this.ferramentasFiltradas = this.ferramentas.filter(f => {
      const matchTermo =
        !termo ||
        f.nome.toLowerCase().includes(termo) ||
        f.codigo.toLowerCase().includes(termo) ||
        f.descricao.toLowerCase().includes(termo);

      const matchStatus =
        this.filtroStatus === 'todos' || f.status === this.filtroStatus;

      return matchTermo && matchStatus;
    });
  }

  setFiltro(status: string) {
    this.filtroStatus = status;
    this.filtrar();
  }

  // ── Helpers visuais ────────────────────────────────────
  getBadgeColor(status: string): string {
    const map: Record<string, string> = {
      disponivel: 'success',
      em_uso:     'warning',
      manutencao: 'danger',
    };
    return map[status] ?? 'medium';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      disponivel: 'Disponível',
      em_uso:     'Em Uso',
      manutencao: 'Manutenção',
    };
    return map[status] ?? status;
  }

  // ── Tempo em uso ───────────────────────────────────────
  calcularTempo(dataRetirada: Date | undefined): string {
    if (!dataRetirada) return '-';
    const diff = Date.now() - new Date(dataRetirada).getTime();
    const min  = Math.floor(diff / 60000);
    const h    = Math.floor(min / 60);
    const m    = min % 60;
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
  }

  // ── Abrir modal conforme status ────────────────────────
  abrirModal(f: Ferramenta) {
    this.ferramentaSelecionada = f;
    this.erroModal             = '';
    this.novoManutentor        = { nome: '', area: '' };

    if (f.status === 'disponivel') {
      this.modalDisponivel = true;
    } else if (f.status === 'em_uso') {
      this.modalEmUso = true;
    } else if (f.status === 'manutencao') {
      this.modalManutencao = true;
    }
  }

  fecharModais() {
    this.modalDisponivel        = false;
    this.modalEmUso             = false;
    this.modalManutencao        = false;
    this.ferramentaSelecionada  = null;
    this.erroModal              = '';
  }

  // ── Ação: Disponível → Em Uso ──────────────────────────
  confirmarEmUso() {
    if (!this.novoManutentor.nome.trim()) {
      this.erroModal = 'Informe o nome do manutentor.';
      return;
    }
    if (!this.novoManutentor.area) {
      this.erroModal = 'Selecione a oficina.';
      return;
    }

    const f = this.ferramentaSelecionada!;
    f.status    = 'em_uso';
    f.manutentor = {
      nome:         this.novoManutentor.nome.trim(),
      area:         this.novoManutentor.area,
      dataRetirada: new Date(),
    };

    this.filtrar();
    this.fecharModais();
    this.exibirToast(`"${f.nome}" registrada como Em Uso.`, 'warning');
  }

  // ── Ação: Em Uso → Disponível ──────────────────────────
  confirmarDevolucao() {
    const f = this.ferramentaSelecionada!;
    f.status     = 'disponivel';
    f.manutentor = undefined;

    this.filtrar();
    this.fecharModais();
    this.exibirToast(`"${f.nome}" devolvida e disponível.`, 'success');
  }

  // ── Ação: Manutenção → Disponível ─────────────────────
  confirmarManutencaoConcluida() {
    const f = this.ferramentaSelecionada!;
    f.status     = 'disponivel';
    f.manutentor = undefined;

    this.filtrar();
    this.fecharModais();
    this.exibirToast(`"${f.nome}" liberada após manutenção.`, 'success');
  }

  // ── Toast ──────────────────────────────────────────────
  async exibirToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 2500,
      position: 'bottom',
      icon: 'checkmark-circle-outline',
    });
    await toast.present();
  }

  // ── Sair ───────────────────────────────────────────────
  sair() {
    sessionStorage.removeItem('usuario');
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }
}