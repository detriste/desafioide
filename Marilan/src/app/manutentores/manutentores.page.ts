import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

export interface Manutentor {
  nome: string;
  area: string;
  ordemServico?: string;
  dataRetirada?: Date;
}

export interface Ferramenta {
  id: number;
  nome: string;
  codigo: string;
  status: 'disponivel' | 'em_uso' | 'manutencao';
  quantidade: number;
  descricao: string;
  manutentor?: Manutentor;
}

export interface SolicitacaoTroca {
  id: number;
  ferramenta_id: number;
  ferramenta_nome: string;
  solicitante_nome: string;
  solicitante_area: string;
  destinatario_nome: string;
  status: 'pendente' | 'aceita' | 'recusada';
  criado_em: string;
}

@Component({
  selector: 'app-manutentores',
  templateUrl: './manutentores.page.html',
  styleUrls: ['./manutentores.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ManutentoresPage implements OnInit {

  abaAtiva: 'em_uso' | 'disponivel' = 'em_uso';

  ferramentas: Ferramenta[] = [];
  ferramentasFiltradas: Ferramenta[] = [];
  termoBusca = '';

  // Modais
  modalAtencaoAberto = false;
  modalTrocaAberto = false;
  modalFormTrocaAberto = false;
  modalTrocasPendentesAberto = false;

  ferramentaSelecionada: Ferramenta | null = null;
  descricaoAtencao = '';
  erroModal = '';
  salvando = false;

  // Troca
  trocaDestinatarioNome = '';
  trocaDestinatarioArea = '';
  trocaOS = '';

  // Solicitações recebidas
  trocasPendentes: SolicitacaoTroca[] = [];
  trocaSelecionada: SolicitacaoTroca | null = null;

  usuarioLogado: any = null;

  private API = 'http://localhost:3000/api';

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    const raw = sessionStorage.getItem('usuario');
    if (raw) this.usuarioLogado = JSON.parse(raw);
    this.carregarFerramentas();
    this.carregarTrocasPendentes();
  }

  carregarFerramentas() {
    this.http.get<any[]>(`${this.API}/ferramentas`).subscribe({
      next: (dados) => {
        this.ferramentas = dados.map(f => ({
          id: f.id,
          codigo: f.codigo,
          nome: f.nome,
          descricao: f.descricao ?? f.nome,
          quantidade: f.quantidade_estoque,
          status: f.status,
          manutentor: f.usuario_nome ? {
            nome: f.usuario_nome,
            area: f.usuario_area,
            ordemServico: f.observacao?.replace('OS: ', ''),
            dataRetirada: f.data_retirada ? new Date(f.data_retirada) : undefined,
          } : undefined,
        }));
        this.filtrar();
      },
      error: () => this.exibirToast('Erro ao carregar ferramentas.', 'danger')
    });
  }

  carregarTrocasPendentes() {
    if (!this.usuarioLogado) return;
    this.http.get<SolicitacaoTroca[]>(
      `${this.API}/trocas/pendentes?destinatario=${encodeURIComponent(this.usuarioLogado.nome)}`
    ).subscribe({
      next: (dados) => this.trocasPendentes = dados,
      error: () => {} // silencioso se rota ainda não existir
    });
  }

  setAba(aba: 'em_uso' | 'disponivel') {
    this.abaAtiva = aba;
    this.termoBusca = '';
    this.filtrar();
  }

  filtrar() {
    const termo = this.termoBusca.toLowerCase().trim();
    this.ferramentasFiltradas = this.ferramentas.filter(f => {
      const matchStatus = f.status === this.abaAtiva;
      const matchTermo = !termo ||
        f.nome.toLowerCase().includes(termo) ||
        f.codigo.toLowerCase().includes(termo);
      return matchStatus && matchTermo;
    });
  }

  getStatusLabel(status: string) {
    return { disponivel: 'Disponível', em_uso: 'Em Uso', manutencao: 'Manutenção' }[status] ?? status;
  }

  // ── Modal Atenção (ponto de atenção "!") ──────────────────────────────────
  abrirModalAtencao(f: Ferramenta) {
    this.ferramentaSelecionada = f;
    this.descricaoAtencao = '';
    this.erroModal = '';
    this.modalAtencaoAberto = true;
  }

  confirmarAtencao() {
    if (!this.descricaoAtencao.trim()) {
      this.erroModal = 'Descreva o problema brevemente.';
      return;
    }
    this.salvando = true;
    this.http.post(`${this.API}/ferramentas/${this.ferramentaSelecionada!.id}/atencao`, {
      observacao: this.descricaoAtencao,
      reporter_nome: this.usuarioLogado?.nome ?? 'Manutentor'
    }).subscribe({
      next: () => {
        this.fecharModais();
        this.exibirToast('Ponto de atenção registrado!', 'warning');
      },
      error: (err) => {
        this.erroModal = err.error?.erro || 'Erro ao registrar.';
        this.salvando = false;
      }
    });
  }

  // ── Modal Solicitar Troca ─────────────────────────────────────────────────
  abrirModalTroca(f: Ferramenta) {
    this.ferramentaSelecionada = f;
    this.trocaDestinatarioNome = '';
    this.trocaDestinatarioArea = '';
    this.trocaOS = '';
    this.erroModal = '';
    this.modalTrocaAberto = true;
  }

  confirmarSolicitacaoTroca() {
    if (!this.trocaDestinatarioNome.trim()) {
      this.erroModal = 'Informe o nome do destinatário.';
      return;
    }
    if (!this.trocaDestinatarioArea) {
      this.erroModal = 'Informe a área do destinatário.';
      return;
    }
    this.salvando = true;
    this.http.post(`${this.API}/trocas/solicitar`, {
      ferramenta_id: this.ferramentaSelecionada!.id,
      ferramenta_nome: this.ferramentaSelecionada!.nome,
      solicitante_nome: this.usuarioLogado?.nome ?? '',
      solicitante_area: this.usuarioLogado?.oficina ?? '',
      destinatario_nome: this.trocaDestinatarioNome.trim(),
      destinatario_area: this.trocaDestinatarioArea,
    }).subscribe({
      next: () => {
        this.fecharModais();
        this.exibirToast('Solicitação enviada!', 'success');
      },
      error: (err) => {
        this.erroModal = err.error?.erro || 'Erro ao solicitar troca.';
        this.salvando = false;
      }
    });
  }

  // ── Modal Trocas Pendentes (recebidas) ────────────────────────────────────
  abrirTrocasPendentes() {
    this.carregarTrocasPendentes();
    this.modalTrocasPendentesAberto = true;
  }

  aceitarTroca(troca: SolicitacaoTroca) {
    this.trocaSelecionada = troca;
    this.trocaOS = '';
    this.erroModal = '';
    this.modalTrocasPendentesAberto = false;
    this.modalFormTrocaAberto = true;
  }

  recusarTroca(troca: SolicitacaoTroca) {
    this.http.post(`${this.API}/trocas/${troca.id}/recusar`, {}).subscribe({
      next: () => {
        this.trocasPendentes = this.trocasPendentes.filter(t => t.id !== troca.id);
        this.exibirToast('Troca recusada.', 'medium');
      },
      error: () => this.exibirToast('Erro ao recusar.', 'danger')
    });
  }

  confirmarFormTroca() {
    const t = this.trocaSelecionada!;
    if (!this.trocaOS.trim()) {
      this.erroModal = 'Informe a Ordem de Serviço.';
      return;
    }
    this.salvando = true;
    this.http.post(`${this.API}/trocas/${t.id}/aceitar`, {
      novo_usuario_nome: this.usuarioLogado?.nome ?? '',
      novo_usuario_area: this.usuarioLogado?.oficina ?? '',
      ordem_servico: this.trocaOS.trim()
    }).subscribe({
      next: () => {
        this.fecharModais();
        this.carregarFerramentas();
        this.exibirToast('Troca realizada com sucesso!', 'success');
      },
      error: (err) => {
        this.erroModal = err.error?.erro || 'Erro ao aceitar troca.';
        this.salvando = false;
      }
    });
  }

  fecharModais() {
    this.modalAtencaoAberto = false;
    this.modalTrocaAberto = false;
    this.modalFormTrocaAberto = false;
    this.modalTrocasPendentesAberto = false;
    this.ferramentaSelecionada = null;
    this.trocaSelecionada = null;
    this.erroModal = '';
    this.salvando = false;
  }

  async exibirToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, color, duration: 2500, position: 'bottom' });
    await toast.present();
  }

  sair() {
    sessionStorage.removeItem('usuario');
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }
}