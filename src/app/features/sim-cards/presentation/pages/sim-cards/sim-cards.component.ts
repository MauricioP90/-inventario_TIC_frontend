import { Component, OnInit, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimCard } from '../../../domain/models/sim-card.model';
import { GetAllSimCardsUseCase } from '../../../application/use-cases/get-all-sim-cards.use-case';
import { AddSimDrawerComponent } from '../../../../../shared/components/drawer/add-sim-drawer.component';

@Component({
  selector: 'app-sim-cards-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AddSimDrawerComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">SIM Cards</h2>
          <p class="text-sm text-slate-500 mt-1">Gestión de líneas telefónicas y tarjetas SIM</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="fetchSimCards()"
            [disabled]="loading()"
            class="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 active:bg-slate-100 rounded-xl border border-slate-200 transition-all shadow-sm bg-white disabled:opacity-50"
            title="Actualizar listado">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class.animate-spin]="loading()">
              <path d="M23 4v6h-6"></path>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>
          <button
            (click)="abrirNuevo()"
            class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-100">
            <span class="text-xl leading-none">+</span> Añadir Nueva SIM
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
        <div class="md:col-span-2 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <!-- Conectamos el buscador -->
          <input type="text" 
                 [ngModel]="searchTerm()" 
                 (ngModelChange)="searchTerm.set($event)"
                 placeholder="Buscar por ICCID, número o placa" 
                 class="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
        </div>
        <!-- Filtro de Estado -->
        <select 
          [ngModel]="statusFilter()" 
          (ngModelChange)="statusFilter.set($event)"
          class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all">
          <option value="">Todos los estados</option>
          <option value="BODEGA">Disponible (Bodega)</option>
          <option value="ASIGNADA">Asignada</option>
          <option value="BAJA">Inactiva (Baja)</option>
        </select>
        <!-- Filtro de Operador -->
        <select 
          [ngModel]="carrierFilter()" 
          (ngModelChange)="carrierFilter.set($event)"
          class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all">
          <option value="">Todos los operadores</option>
          <option value="CLARO">Claro</option>
          <option value="MOVISTAR">Movistar</option>
          <option value="TIGO">Tigo</option>
          <option value="WOM">Wom</option>
        </select>
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      }
      @if (!loading()) {
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Número</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">ICCID</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Operador</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Ubicación</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Estado</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Equipo Asignado</th>
                <th class="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (sim of paginatedSimCards(); track sim.id) {
                <tr 
                  [class.bg-emerald-50/70]="newlyCreatedNumero() === sim.numero"
                  [class.hover:bg-emerald-100/50]="newlyCreatedNumero() === sim.numero"
                  class="hover:bg-slate-50/50 transition-all duration-500">
                  <td class="px-6 py-4 font-bold text-slate-700">{{ sim.numero }}</td>
                  <td class="px-6 py-4 text-slate-400 font-medium text-xs">{{ sim.iccid }}</td>
                  <td class="px-6 py-4">
                    <span [class]="carrierClass(sim.operador)">{{ sim.operador }}</span>
                  </td>
                  <td class="px-6 py-4 text-slate-500 font-medium">
                    {{ sim.location?.nombre || '—' }}
                  </td>
                  <td class="px-6 py-4">
                    <span [class]="statusClass(sim.estado)">{{ statusLabel(sim.estado) }}</span>
                  </td>
                  <td class="px-6 py-4 font-bold text-indigo-900/60">{{ sim.activo?.placa ?? '—' }}</td>
                  <td class="px-6 py-4 text-right">
                    <button 
                      (click)="editSim(sim)"
                      class="text-indigo-600 hover:text-indigo-900 font-medium transition-all">
                      Editar
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="px-6 py-12 text-center text-slate-400 text-sm">Sin SIM cards registradas</td></tr>
              }
            </tbody>
          </table>
          <!-- Barra de navegación de páginas (Paginación) -->
          <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium select-none">
            <!-- Rango actual -->
            <div>
              Mostrando <span class="font-bold text-slate-700">{{ startIndex() }}</span> a 
              <span class="font-bold text-slate-700">{{ endIndex() }}</span> de 
              <span class="font-bold text-slate-700">{{ filteredSimCards().length }}</span> SIM cards
            </div>
            
            <!-- Controles -->
            <div class="flex items-center gap-4">
              <!-- Selector de cantidad por página -->
              <div class="flex items-center gap-1.5">
                <span>Filas por página:</span>
                <select 
                  [ngModel]="pageSize()" 
                  (ngModelChange)="pageSize.set(+$event)"
                  class="bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500/30">
                  <option [value]="5">5</option>
                  <option [value]="10">10</option>
                  <option [value]="25">25</option>
                  <option [value]="50">50</option>
                </select>
              </div>

              <!-- Navegación -->
              <div class="flex items-center gap-1">
                <button 
                  (click)="prevPage()" 
                  [disabled]="currentPage() === 1"
                  class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold">
                  ‹
                </button>
                <span class="text-slate-600 font-bold px-1">Pág. {{ currentPage() }} de {{ totalPages() }}</span>
                <button 
                  (click)="nextPage()" 
                  [disabled]="currentPage() === totalPages()"
                  class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold">
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Drawer para agregar SIM -->
    <app-add-sim-drawer
      [open]="showDrawer()"
      [simCard]="selectedSim()"
      (openChange)="handleDrawerOpenChange($event)"
      (saved)="handleSaved($event)"
    />
  `,
  styles: []
})
export class SimCardsPageComponent implements OnInit {
  simCards = signal<SimCard[]>([]);
  loading = signal(false);
  showDrawer = signal(false);
  selectedSim = signal<SimCard | null>(null);
  searchTerm = signal('');
  statusFilter = signal('');
  carrierFilter = signal('');

  // --- Lógica de filtrado inteligente ---
  filteredSimCards = computed(() => {
    const list = this.simCards();
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    const carrier = this.carrierFilter().toUpperCase();
    return list.filter(sim => {
      // 1. Filtro por texto (ICCID, Número o Placa del Equipo Asignado)
      const matchesSearch = !search ||
        sim.iccid.toLowerCase().includes(search) ||
        sim.numero.toLowerCase().includes(search) ||
        (sim.activo?.placa && sim.activo.placa.toLowerCase().includes(search)) ||
        (sim.activoId && sim.activoId.toLowerCase().includes(search));
      // 2. Filtro por Estado
      const matchesStatus = !status || sim.estado === status;
      // 3. Filtro por Operador
      const matchesCarrier = !carrier || sim.operador === carrier;
      return matchesSearch && matchesStatus && matchesCarrier;
    });
  });

  newlyCreatedNumero = signal<string | null>(null);

  // Señales de Paginación
  currentPage = signal(1);
  pageSize = signal(10);

  // SIM Cards paginadas
  paginatedSimCards = computed(() => {
    const list = this.filteredSimCards();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return list.slice(start, end);
  });

  startIndex = computed(() => {
    if (this.filteredSimCards().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  endIndex = computed(() => {
    const end = this.currentPage() * this.pageSize();
    const total = this.filteredSimCards().length;
    return end > total ? total : end;
  });

  totalPages = computed(() => {
    const total = this.filteredSimCards().length;
    const size = this.pageSize();
    return Math.max(Math.ceil(total / size), 1);
  });

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  constructor(private getAllSimCards: GetAllSimCardsUseCase) {
    effect(() => {
      // Reaccionar a cambios en filtros y reiniciar a página 1
      this.searchTerm();
      this.statusFilter();
      this.carrierFilter();
      
      untracked(() => {
        this.currentPage.set(1);
      });
    });
  }

  ngOnInit() {
    this.fetchSimCards();
  }

  handleSaved(numero: string) {
    this.fetchSimCards();
    if (numero) {
      this.newlyCreatedNumero.set(numero);
      setTimeout(() => {
        this.newlyCreatedNumero.set(null);
      }, 30000);
    }
  }

  fetchSimCards() {
    this.loading.set(true);
    this.getAllSimCards.execute().subscribe({
      next: (data) => {
        this.simCards.set(data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  editSim(sim: SimCard) {
    this.selectedSim.set(sim);
    this.showDrawer.set(true);
  }

  handleDrawerOpenChange(isOpen: boolean) {
    this.showDrawer.set(isOpen);
    if (!isOpen) {
      this.selectedSim.set(null);
    }
  }

  abrirNuevo() {
    this.selectedSim.set(null);
    this.showDrawer.set(true);
  }

  carrierClass(carrier: string): string {
    const base = 'text-[10px] font-bold px-2 py-0.5 rounded-full border ';
    switch (carrier.toLowerCase()) {
      case 'claro': return base + 'bg-red-50 text-red-600 border-red-100';
      case 'movistar': return base + 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'tigo': return base + 'bg-blue-50 text-blue-600 border-blue-100';
      case 'wom': return base + 'bg-purple-50 text-purple-600 border-purple-100';
      default: return base + 'bg-slate-50 text-slate-600 border-slate-100';
    }
  }

  statusClass(status: string): string {
    const base = 'text-[10px] font-bold px-2.5 py-1 rounded-lg text-white ';
    switch (status.toUpperCase()) {
      case 'ASIGNADA': return base + 'bg-indigo-800/80';
      case 'BODEGA': return base + 'bg-emerald-500';
      case 'BAJA': return base + 'bg-red-600';
      default: return base + 'bg-slate-400';
    }
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      BODEGA: 'Disponible', ASIGNADA: 'Asignada', BAJA: 'Inactiva'
    };
    return map[status.toUpperCase()] ?? status;
  }
}
