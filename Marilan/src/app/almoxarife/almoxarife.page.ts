import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
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
  localizacao?: string;
  observacao?: string;
  manutentor?: Manutentor;
}

@Component({
  selector: 'app-almoxarife',
  templateUrl: './almoxarife.page.html',
  styleUrls: ['./almoxarife.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AlmoxarifePage implements OnInit, OnDestroy {

  modalRetiradaAberto = false;
  modalManutencaoAberto = false;

  ferramentaSelecionada: Ferramenta | null = null;
  erroModal = '';

  dadosRetirada = {
    cracha: '',
    usuario_nome: '',
    usuario_area: '',
    ordem_servico: ''
  };

  solicitacoesPendentes: any[] = [];
  modalSolicitacoesAberto = false;

  descricaoManutencao = '';
  salvando = false;

  termoBusca = '';
  filtroStatus = 'todos';

  ferramentas: Ferramenta[] = [];
  ferramentasFiltradas: Ferramenta[] = [];
  carregando = false;

  usuarioLogado: any = null;
  private intervaloAtualizacao: any;

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
    this.carregarSolicitacoes();

    this.intervaloAtualizacao = setInterval(() => {
      const algumModalAberto =
        this.modalRetiradaAberto ||
        this.modalManutencaoAberto ||
        this.modalSolicitacoesAberto;

      if (!algumModalAberto) {
        this.carregarFerramentas();
        this.carregarSolicitacoes();
      }
    }, 5000);
  }

  ngOnDestroy() {
    if (this.intervaloAtualizacao) {
      clearInterval(this.intervaloAtualizacao);
    }
  }

  irPara(rota: string) {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTimeout(() => {
      this.router.navigateByUrl('/' + rota, { replaceUrl: true });
    }, 50);
  }

  carregarFerramentas() {
    this.carregando = true;
    this.http.get<any[]>(`${this.API}/ferramentas`).subscribe({
      next: (dados) => {
        this.ferramentas = dados.map(f => ({
          observacao: f.observacao ?? undefined,
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
        this.carregando = false;
      },
      error: () => {
        this.exibirToast('Erro ao carregar ferramentas.', 'danger');
        this.carregando = false;
      }
    });
  }

  filtrar() {
    const termo = this.termoBusca.toLowerCase().trim();
    this.ferramentasFiltradas = this.ferramentas.filter(f => {
      const matchTermo =
        !termo ||
        f.nome.toLowerCase().includes(termo) ||
        f.codigo.toLowerCase().includes(termo);

      const matchStatus =
        this.filtroStatus === 'todos' || f.status === this.filtroStatus;

      return matchTermo && matchStatus;
    });
  }

  setFiltro(status: string) {
    this.filtroStatus = status;
    this.filtrar();
  }

  getStatusLabel(status: string): string {
    return {
      disponivel: 'Disponível',
      em_uso: 'Em Uso',
      manutencao: 'Manutenção'
    }[status] ?? status;
  }

  abrirModalRetirada(f: Ferramenta) {
    this.ferramentaSelecionada = f;
    this.erroModal = '';
    this.dadosRetirada = { cracha: '', usuario_nome: '', usuario_area: '', ordem_servico: '' };
    this.descricaoManutencao = '';
    this.modalRetiradaAberto = true;
  }

  abrirModalManutencao(f: Ferramenta) {
    this.ferramentaSelecionada = f;
    this.erroModal = '';
    this.descricaoManutencao = '';
    this.modalManutencaoAberto = true;
  }

  fecharModais() {
    this.modalSolicitacoesAberto = false;
    this.modalRetiradaAberto = false;
    this.modalManutencaoAberto = false;
    this.ferramentaSelecionada = null;
    this.erroModal = '';
    this.salvando = false;
  }

  buscarUsuarioPorCracha() {
    const cracha = this.dadosRetirada.cracha?.trim();
    if (!cracha) return;

    this.erroModal = '';
    this.http.get<any>(`${this.API}/usuarios/cracha/${cracha}`).subscribe({
      next: (res) => {
        this.dadosRetirada.usuario_nome = res.nome;
      },
      error: () => {
        this.erroModal = 'Usuário não encontrado.';
        this.dadosRetirada.usuario_nome = '';
      }
    });
  }

  confirmarRetirada() {
    const f = this.ferramentaSelecionada!;
    if (!this.dadosRetirada.cracha?.trim()) { this.erroModal = 'Informe o Crachá.'; return; }
    if (!this.dadosRetirada.usuario_nome?.trim()) { this.erroModal = 'Crachá não encontrado.'; return; }
    if (!this.dadosRetirada.usuario_area?.trim()) { this.erroModal = 'Informe a área.'; return; }
    if (!this.dadosRetirada.ordem_servico?.trim()) { this.erroModal = 'Informe a Ordem de Serviço.'; return; }

    this.salvando = true;
    this.http.post(`${this.API}/ferramentas/${f.id}/retirar`, {
      usuario_nome: this.dadosRetirada.usuario_nome,
      usuario_area: this.dadosRetirada.usuario_area,
      ordem_servico: this.dadosRetirada.ordem_servico
    }).subscribe({
      next: () => {
        this.fecharModais();
        this.carregarFerramentas();
      },
      error: (err) => {
        this.erroModal = err.error?.erro || 'Erro ao retirar.';
        this.salvando = false;
      }
    });
  }

  confirmarManutencao() {
    const f = this.ferramentaSelecionada!;
    if (!this.descricaoManutencao.trim()) {
      this.erroModal = 'Descreva o problema.';
      return;
    }

    this.salvando = true;
    this.http.post(`${this.API}/ferramentas/${f.id}/manutencao`, {
      observacao: this.descricaoManutencao
    }).subscribe({
      next: () => {
        this.fecharModais();
        this.carregarFerramentas();
      },
      error: (err) => {
        this.erroModal = err.error?.erro || 'Erro na manutenção.';
        this.salvando = false;
      }
    });
  }

  executarDevolucao(f: Ferramenta) {
    this.ferramentaSelecionada = f;
    this.http.post(`${this.API}/ferramentas/${f.id}/devolver`, {}).subscribe({
      next: () => {
        this.fecharModais();
        this.carregarFerramentas();
      },
      error: (err) => {
        this.exibirToast(err.error?.erro || 'Erro ao devolver.', 'danger');
      }
    });
  }

  executarDisponibilizar(f: Ferramenta) {
    this.ferramentaSelecionada = f;
    this.http.post(`${this.API}/ferramentas/${f.id}/disponibilizar`, {}).subscribe({
      next: () => {
        this.fecharModais();
        this.carregarFerramentas();
      },
      error: (err) => {
        this.exibirToast(err.error?.erro || 'Erro ao liberar.', 'danger');
      }
    });
  }

  async exibirToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 2500,
      position: 'bottom'
    });
    await toast.present();
  }

  carregarSolicitacoes() {
    this.http.get<any[]>(`${this.API}/solicitacoes/pendentes`).subscribe({
      next: (dados) => this.solicitacoesPendentes = dados,
      error: () => {}
    });
  }

  abrirSolicitacoes() {
    this.carregarSolicitacoes();
    this.modalSolicitacoesAberto = true;
  }

  aprovarSolicitacao(s: any) {
    this.http.post(`${this.API}/solicitacoes/${s.id}/aprovar`, {}).subscribe({
      next: () => {
        this.solicitacoesPendentes = this.solicitacoesPendentes.filter(x => x.id !== s.id);
        this.carregarFerramentas();
        this.exibirToast(`Retirada de "${s.ferramenta_nome}" aprovada.`, 'success');
      },
      error: (err) => this.exibirToast(err.error?.erro || 'Erro ao aprovar.', 'danger')
    });
  }

  recusarSolicitacao(s: any) {
    this.http.post(`${this.API}/solicitacoes/${s.id}/recusar`, {}).subscribe({
      next: () => {
        this.solicitacoesPendentes = this.solicitacoesPendentes.filter(x => x.id !== s.id);
        this.exibirToast('Solicitação recusada.', 'medium');
      },
      error: () => this.exibirToast('Erro ao recusar.', 'danger')
    });
  }

  sair() {
    if (this.intervaloAtualizacao) {
      clearInterval(this.intervaloAtualizacao);
    }
    sessionStorage.removeItem('usuario');
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }
}