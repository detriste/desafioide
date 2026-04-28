import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ ADICIONADO
import { FormsModule } from '@angular/forms';   // ✅ ADICIONADO
import { IonicModule } from '@ionic/angular';   // ✅ ADICIONADO

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
  localizacao?: string;
  manutentor?: Manutentor;
}

@Component({
  selector: 'app-almoxarife',
  templateUrl: './almoxarife.page.html',
  styleUrls: ['./almoxarife.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ] // ✅ ESSA PARTE RESOLVE TODOS OS ERROS
})
export class AlmoxarifePage implements OnInit {

  modalDisponivel = false;
  modalEmUso      = false;
  modalManutencao = false;

  ferramentaSelecionada: Ferramenta | null = null;
  erroModal = '';

  novoManutentor = {
    nome: '',
    area: '',
    ordemServico: ''
  };

  observacaoManutencao = '';

  termoBusca   = '';
  filtroStatus = 'todos';

  ferramentas: Ferramenta[] = [];
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
          descricao:  f.descricao ?? f.nome,
          quantidade: f.quantidade_estoque,
          status:     f.status,
          manutentor: f.usuario_nome ? {
            nome:         f.usuario_nome,
            area:         f.usuario_area,
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

  getBadgeColor(status: string): string {
    return {
      disponivel: 'success',
      em_uso: 'warning',
      manutencao: 'danger'
    }[status] ?? 'medium';
  }

  getStatusLabel(status: string): string {
    return {
      disponivel: 'Disponível',
      em_uso: 'Em Uso',
      manutencao: 'Manutenção'
    }[status] ?? status;
  }

  abrirModal(f: Ferramenta) {
    this.ferramentaSelecionada = f;
    this.erroModal = '';
    this.novoManutentor = { nome: '', area: '', ordemServico: '' };
    this.observacaoManutencao = '';

    if (f.status === 'disponivel') {
      this.modalDisponivel = true;
    } else if (f.status === 'em_uso') {
      this.modalEmUso = true;
    } else {
      this.modalManutencao = true;
    }
  }

  fecharModais() {
    this.modalDisponivel = false;
    this.modalEmUso = false;
    this.modalManutencao = false;
    this.ferramentaSelecionada = null;
    this.erroModal = '';
  }

  confirmarEmUso() {
    const f = this.ferramentaSelecionada!;

    if (!this.novoManutentor.nome.trim()) {
      this.erroModal = 'Informe o nome.';
      return;
    }

    if (!this.novoManutentor.area) {
      this.erroModal = 'Informe a área.';
      return;
    }

    this.http.post(`${this.API}/ferramentas/${f.id}/retirar`, {
      usuario_nome: this.novoManutentor.nome,
      usuario_area: this.novoManutentor.area,
      ordem_servico: this.novoManutentor.ordemServico
    }).subscribe({
      next: () => {
        this.fecharModais();
        this.carregarFerramentas();
      },
      error: (err) => {
        this.erroModal = err.error?.erro || 'Erro ao retirar.';
      }
    });
  }

  confirmarDevolucao() {
    const f = this.ferramentaSelecionada!;

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

  confirmarManutencaoConcluida() {
    const f = this.ferramentaSelecionada!;

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

  enviarParaManutencao() {
    const f = this.ferramentaSelecionada!;

    if (!this.observacaoManutencao.trim()) {
      this.erroModal = 'Descreva o problema.';
      return;
    }

    this.http.post(`${this.API}/ferramentas/${f.id}/manutencao`, {
      observacao: this.observacaoManutencao
    }).subscribe({
      next: () => {
        this.fecharModais();
        this.carregarFerramentas();
      },
      error: (err) => {
        this.erroModal = err.error?.erro || 'Erro na manutenção.';
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

  sair() {
    sessionStorage.removeItem('usuario');
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }
}