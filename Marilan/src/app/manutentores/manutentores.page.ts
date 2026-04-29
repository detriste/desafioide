import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

export interface Manutentor {
  nome: string;
  area: string;
  cpf?: string;
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
  temAtencao?: boolean;
}

export interface SolicitacaoTroca {
  id: number;
  ferramenta_id: number;
  ferramenta_nome: string;
  solicitante_nome: string;
  solicitante_area: string;
  destinatario_nome: string;
  status: 'pendente' | 'aceita' | 'recusada' | 'concluida';
  criado_em: string;
}

export interface RegistroAtencao {
  usuario_nome: string;
  observacao: string;
  criado_em: string;
}

@Component({
  selector: 'app-manutentores',
  templateUrl: './manutentores.page.html',
  styleUrls: ['./manutentores.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ManutentoresPage implements OnInit, OnDestroy {

  abaAtiva: 'em_uso' | 'disponivel' = 'em_uso';

  ferramentas: Ferramenta[] = [];
  ferramentasFiltradas: Ferramenta[] = [];
  termoBusca = '';

  // ── Modais ────────────────────────────────────────────────────────────────
  modalAtencaoAberto = false;
  modalVerAtencaoAberto = false;
  modalTrocaAberto = false;
  modalTrocasPendentesAberto = false;
  modalFormTrocaAberto = false;
  modalOsSolicitanteAberto = false;

  ferramentaSelecionada: Ferramenta | null = null;
  descricaoAtencao = '';
  erroModal = '';
  salvando = false;
  private intervaloAtualizacao: any;
  cpfSolicitante = '';
nomeSolicitante = '';
oficinaSolicitante = '';

  // ── Atenções ──────────────────────────────────────────────────────────────
  atencoesDaFerramenta: RegistroAtencao[] = [];

  // ── Troca — solicitar (destinatário por CPF) ──────────────────────────────
  trocaCpfDestinatario = '';
  trocaDestinatarioNome = '';
  trocaDestinatarioArea = '';
  erroCpfTroca = '';
  areaDeUso = '';
  // ── Troca — receber (pendentes) ───────────────────────────────────────────
  trocasPendentes: SolicitacaoTroca[] = [];
  trocaSelecionada: SolicitacaoTroca | null = null;
  trocaOS = '';

  // ── Troca — concluir (solicitante preenche após aceite) ───────────────────
  trocasAceitas: SolicitacaoTroca[] = [];
  trocaAceitaSelecionada: SolicitacaoTroca | null = null;
  osSolicitante = '';
  trocaCpfSolicitante = '';
  solicitanteNome = '';
  solicitanteArea = '';
  erroCpfSolicitante = '';

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
    this.recarregarTudo();
   this.intervaloAtualizacao = setInterval(() => {
  const algumModalAberto =
    this.modalAtencaoAberto ||
    this.modalVerAtencaoAberto ||
    this.modalTrocaAberto ||
    this.modalTrocasPendentesAberto ||
    this.modalOsSolicitanteAberto;

  if (!algumModalAberto) {
    this.recarregarTudo();
  }
}, 5000);
  }

  ngOnDestroy() {
    if (this.intervaloAtualizacao) {
      clearInterval(this.intervaloAtualizacao);
    }
  }

  carregarFerramentas() {
    this.http.get<any[]>(`${this.API}/ferramentas`).subscribe({
      next: (dados) => {
        const novas = dados.map(f => ({
          id: f.id,
          codigo: f.codigo,
          nome: f.nome,
          descricao: f.descricao ?? f.nome,
          quantidade: f.quantidade_estoque,
          status: f.status,
          temAtencao: this.ferramentas.find(x => x.id === f.id)?.temAtencao ?? false,
          manutentor: f.usuario_nome ? {
            nome: f.usuario_nome,
            cpf: f.usuario_cpf,
            area: f.usuario_area,
            ordemServico: f.observacao?.replace('OS: ', ''),
            dataRetirada: f.data_retirada ? new Date(f.data_retirada) : undefined,
          } : undefined,
        }));

        // Atualiza só os campos que mudaram, sem recriar o array inteiro
        novas.forEach(nova => {
          const existente = this.ferramentas.find(x => x.id === nova.id);
          if (existente) {
            existente.status = nova.status;
            existente.manutentor = nova.manutentor;
            existente.quantidade = nova.quantidade;
          }
        });

        // Adiciona ferramentas novas que ainda não existem
        novas.forEach(nova => {
          if (!this.ferramentas.find(x => x.id === nova.id)) {
            this.ferramentas.push(nova);
          }
        });

        // Remove ferramentas que sumiram do servidor
        this.ferramentas = this.ferramentas.filter(f =>
          novas.find(n => n.id === f.id)
        );

        this.filtrar();
        this.verificarAtencoes();
      },
      error: () => {}
    });
  }

  recarregarTudo() {
    this.carregarFerramentas();
    this.carregarTrocasPendentes();
    this.carregarTrocasAceitas();
  }

 verificarAtencoes() {
    const emUso = this.ferramentas.filter(f => f.status === 'em_uso');
    emUso.forEach(f => {
      this.http.get<RegistroAtencao[]>(`${this.API}/ferramentas/${f.id}/atencoes`).subscribe({
        next: (lista) => {
          f.temAtencao = lista.length > 0;
          this.filtrar();
        },
        error: () => {}
      });
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

  // ── Ponto de Atenção ──────────────────────────────────────────────────────
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
      this.ferramentaSelecionada!.temAtencao = true;
      this.fecharModais();
      this.exibirToast('Ponto de atenção registrado!', 'warning');
    },
    error: (err) => {
      this.erroModal = err.error?.erro || 'Erro ao registrar.';
      this.salvando = false;
    }
  });
}

abrirVerAtencoes(f: Ferramenta) {
    this.ferramentaSelecionada = f;
    this.atencoesDaFerramenta = [];
    this.modalVerAtencaoAberto = true;
    this.recarregarTudo();
    this.http.get<RegistroAtencao[]>(`${this.API}/ferramentas/${f.id}/atencoes`).subscribe({
      next: (lista) => this.atencoesDaFerramenta = lista,
      error: () => this.exibirToast('Erro ao carregar atenções.', 'danger')
    });
  }

  buscarSolicitantePorCPF() {
    const cpf = this.cpfSolicitante?.trim();
    if (!cpf) return;
    this.erroModal = '';
  
    // Bloqueia troca consigo mesmo
    if (cpf === this.ferramentaSelecionada?.manutentor?.cpf ||
        this.ferramentaSelecionada?.manutentor?.nome === this.usuarioLogado?.nome) {
      this.erroModal = 'Você não pode solicitar uma troca consigo mesmo.';
      this.nomeSolicitante = '';
      this.oficinaSolicitante = '';
      return;
    }
  
    this.http.get<any>(`${this.API}/usuarios/cpf/${cpf}`).subscribe({
      next: (res) => {
        // Bloqueia se o CPF buscado for o mesmo do dono atual da ferramenta
        if (res.nome === this.ferramentaSelecionada?.manutentor?.nome) {
          this.erroModal = 'Você não pode solicitar uma troca consigo mesmo.';
          this.nomeSolicitante = '';
          this.oficinaSolicitante = '';
          return;
        }
        this.nomeSolicitante = res.nome;
        this.oficinaSolicitante = res.area;
      },
      error: () => {
        this.erroModal = 'CPF não encontrado.';
        this.nomeSolicitante = '';
        this.oficinaSolicitante = '';
      }
    });
  }
  // ── Solicitar Troca ───────────────────────────────────────────────────────
  abrirModalTroca(f: Ferramenta) {
    this.ferramentaSelecionada = f;
    this.cpfSolicitante = '';
    this.nomeSolicitante = '';
    this.oficinaSolicitante = '';
    this.erroModal = '';
    this.modalTrocaAberto = true;
  }
  buscarDestinatarioPorCPF() {
    const cpf = this.trocaCpfDestinatario?.trim();
    if (!cpf) return;
    this.erroCpfTroca = '';
    this.http.get<any>(`${this.API}/usuarios/cpf/${cpf}`).subscribe({
      next: (res) => {
        this.trocaDestinatarioNome = res.nome;
        this.trocaDestinatarioArea = res.area;
      },
      error: () => {
        this.erroCpfTroca = 'Usuário não encontrado.';
        this.trocaDestinatarioNome = '';
        this.trocaDestinatarioArea = '';
      }
    });
  }

  confirmarSolicitacaoTroca() {
    if (!this.nomeSolicitante.trim()) {
      this.erroModal = 'Informe seu CPF primeiro.';
      return;
    }
    const f = this.ferramentaSelecionada!;
    this.salvando = true;
    this.http.post(`${this.API}/trocas/solicitar`, {
      ferramenta_id:     f.id,
      ferramenta_nome:   f.nome,
      solicitante_nome:  this.nomeSolicitante,
      solicitante_area:  this.oficinaSolicitante,
      destinatario_nome: f.manutentor?.nome ?? '',
      destinatario_area: f.manutentor?.area ?? '',
    }).subscribe({
      next: () => {
        this.fecharModais();
        this.recarregarTudo();
        this.exibirToast('Solicitação enviada!', 'success');
      },
      error: (err) => {
        this.erroModal = err.error?.erro || 'Erro ao solicitar troca.';
        this.salvando = false;
      }
    });
  }
  // ── Trocas Pendentes (destinatário recebe) ────────────────────────────────
  carregarTrocasPendentes() {
    if (!this.usuarioLogado) return;
    this.http.get<SolicitacaoTroca[]>(
      `${this.API}/trocas/pendentes?destinatario=${encodeURIComponent(this.usuarioLogado.nome)}`
    ).subscribe({
      next: (dados) => this.trocasPendentes = dados,
      error: () => {}
    });
  }

  formatarCpf(event: any, campo: 'cpfSolicitante' | 'trocaCpfSolicitante') {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length <= 11) {
      valor = valor
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    this[campo] = valor;
  }

  abrirTrocasPendentes() {
    this.recarregarTudo();
    this.modalTrocasPendentesAberto = true;
  }

  aceitarTroca(troca: SolicitacaoTroca) {
    // Só marca como aceita no backend — sem OS aqui
    this.http.post(`${this.API}/trocas/${troca.id}/aceitar`, {}).subscribe({
      next: () => {
        this.trocasPendentes = this.trocasPendentes.filter(t => t.id !== troca.id);
        this.fecharModais();
        this.exibirToast('Troca aceita! O solicitante será notificado.', 'success');
      },
      error: (err) => this.exibirToast(err.error?.erro || 'Erro ao aceitar.', 'danger')
    });
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

  // ── Trocas Aceitas (solicitante conclui) ──────────────────────────────────
  carregarTrocasAceitas() {
    if (!this.usuarioLogado) return;
    this.http.get<SolicitacaoTroca[]>(
      `${this.API}/trocas/aceitas?solicitante=${encodeURIComponent(this.usuarioLogado.nome)}`
    ).subscribe({
  
       next: (dados) => {
  const minhas = dados.filter(t => t.solicitante_nome === this.usuarioLogado?.nome);
  this.trocasAceitas = minhas;
  if (minhas.length > 0) {
    this.trocaAceitaSelecionada = minhas[0];
    this.osSolicitante = '';
    this.trocaCpfSolicitante = '';
    this.solicitanteNome = '';
    this.solicitanteArea = '';
    this.erroModal = '';
    if (!this.modalOsSolicitanteAberto) {
      this.modalOsSolicitanteAberto = true;
    }
  }
},
      error: () => {}
    });
  }

  buscarCpfSolicitante() {
    const cpf = this.trocaCpfSolicitante?.trim();
    if (!cpf) return;
    this.erroCpfSolicitante = '';
    this.http.get<any>(`${this.API}/usuarios/cpf/${cpf}`).subscribe({
      next: (res) => {
        this.solicitanteNome = res.nome;
        this.solicitanteArea = res.area;
      },
      error: () => {
        this.erroCpfSolicitante = 'Usuário não encontrado.';
        this.solicitanteNome = '';
        this.solicitanteArea = '';
      }
    });
  }

  confirmarOsSolicitante() {
    if (!this.areaDeUso.trim()) {
      this.erroModal = 'Informe a área de uso.';
      return;
    }
    if (!this.osSolicitante.trim()) {
      this.erroModal = 'Informe a Ordem de Serviço.';
      return;
    }
    const t = this.trocaAceitaSelecionada!;
    this.salvando = true;
  
    this.http.post(`${this.API}/trocas/${t.id}/concluir`, {
      usuario_cpf:   this.usuarioLogado?.cpf ?? null,
      usuario_nome:  this.usuarioLogado?.nome ?? '',
      usuario_area:  this.areaDeUso.trim(),
      ordem_servico: this.osSolicitante.trim()
    }).subscribe({
      next: () => {
        this.modalOsSolicitanteAberto = false;
        this.trocasAceitas = this.trocasAceitas.filter(x => x.id !== t.id);
        this.carregarFerramentas();
        this.exibirToast('Ferramenta registrada no seu nome!', 'success');
        this.salvando = false;
      },
      error: (err) => {
        this.erroModal = err.error?.erro || 'Erro ao registrar.';
        this.salvando = false;
      }
    });
  }

  // ── Fechar todos os modais ────────────────────────────────────────────────
 fecharModais() {
    this.modalAtencaoAberto = false;
    this.modalVerAtencaoAberto = false;
    this.modalTrocaAberto = false;
    this.modalTrocasPendentesAberto = false;
    this.modalFormTrocaAberto = false;
    this.modalOsSolicitanteAberto = false;
    this.ferramentaSelecionada = null;
    this.trocaSelecionada = null;
    this.trocaAceitaSelecionada = null;
    this.trocaCpfSolicitante = '';
    this.solicitanteNome = '';
    this.solicitanteArea = '';
    this.erroCpfSolicitante = '';
    this.erroModal = '';
    this.salvando = false;
    
  }

  async exibirToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, color, duration: 2500, position: 'bottom' });
    await toast.present();
  }

 sair() {
    if (this.intervaloAtualizacao) {
      clearInterval(this.intervaloAtualizacao);
    }
    sessionStorage.removeItem('usuario');
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }
}