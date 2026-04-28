import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

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
  ];
ferramentasFiltradas: Ferramenta[] = [];
carregando = false;

private API = 'http://localhost:3000/api';

constructor(
  private router: Router,
  private http: HttpClient,
  private toastCtrl: ToastController,
) {}

ngOnInit() {
  this.carregarFerramentas();
}

carregarFerramentas() {
  this.carregando = true;
  this.http.get<any[]>(`${this.API}/ferramentas`).subscribe({
    next: (dados) => {
      this.ferramentas = dados.map(f => ({
        id:         f.id,
        codigo:     f.codigo,
        nome:       f.nome,
        descricao:  f.nome,
        quantidade: f.quantidade_estoque,
        status:     (f.estoque_final > 0 ? 'disponivel' : 'em_uso') as any,
        manutentor: undefined,
      }));
      this.ferramentasFiltradas = [...this.ferramentas];
      this.carregando = false;
    },
    error: () => {
      this.exibirToast('Erro ao carregar ferramentas.', 'danger');
      this.carregando = false;
    }
  });
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