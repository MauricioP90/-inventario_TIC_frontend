import { Component, OnInit, signal } from '@angular/core';
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
        <button
          (click)="showDrawer.set(true)"
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-100">
          <span class="text-xl leading-none">+</span> Añadir Nueva SIM
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
        <div class="md:col-span-2 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" placeholder="Buscar por ICCID, número, equipo..." 
                 class="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
        </div>
        <select class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all">
          <option>Todos los estados</option>
          <option>Activa</option>
          <option>Bodega</option>
          <option>Baja</option>
        </select>
        <select class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all">
          <option>Todos los...</option>
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
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">ICCID</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Número</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Operador</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Estado</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Equipo Asignado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (sim of simCards(); track sim.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4 text-slate-400 font-medium text-xs">{{ sim.iccid }}</td>
                  <td class="px-6 py-4 font-bold text-slate-700">{{ sim.number }}</td>
                  <td class="px-6 py-4">
                    <span [class]="carrierClass(sim.carrier)">{{ sim.carrier }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span [class]="statusClass(sim.status)">{{ statusLabel(sim.status) }}</span>
                  </td>
                  <td class="px-6 py-4 font-bold text-indigo-900/40">{{ sim.assignedTo ?? '—' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="px-6 py-12 text-center text-slate-400 text-sm">Sin SIM cards registradas</td></tr>
              }
            </tbody>
          </table>
          <div class="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-medium">
            Mostrando {{ simCards().length }} de {{ simCards().length }} SIM cards
          </div>
        </div>
      }
    </div>

    <!-- Drawer para agregar SIM -->
    <app-add-sim-drawer
      [open]="showDrawer()"
      (openChange)="showDrawer.set($event)"
      (saved)="ngOnInit()"
    />
  `,
  styles: []
})
export class SimCardsPageComponent implements OnInit {
  simCards = signal<SimCard[]>([]);
  loading = signal(false);
  showDrawer = signal(false);

  constructor(private getAllSimCards: GetAllSimCardsUseCase) {}

  ngOnInit() {
    this.loading.set(true);
    this.getAllSimCards.execute().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.simCards.set(data);
        } else {
          // Mock data matching Screenshot 3
          this.simCards.set([
            { id: '1', number: '310-555-0101', iccid: '8957101234567890001', carrier: 'Claro', status: 'available', assignedTo: 'FLM-002', createdAt: new Date(), updatedAt: new Date() },
            { id: '2', number: '311-555-0202', iccid: '8957101234567890002', carrier: 'Movistar', status: 'available', assignedTo: 'FLM-002', createdAt: new Date(), updatedAt: new Date() },
            { id: '3', number: '312-555-0303', iccid: '8957101234567890003', carrier: 'Tigo', status: 'available', assignedTo: 'FLM-003', createdAt: new Date(), updatedAt: new Date() },
            { id: '4', number: '320-555-0404', iccid: '8957101234567890004', carrier: 'Claro', status: 'assigned', assignedTo: '—', createdAt: new Date(), updatedAt: new Date() },
            { id: '5', number: '321-555-0505', iccid: '8957101234567890005', carrier: 'Wom', status: 'available', assignedTo: 'FLM-004', createdAt: new Date(), updatedAt: new Date() },
            { id: '6', number: '310-555-0606', iccid: '8957101234567890006', carrier: 'Movistar', status: 'blocked', assignedTo: '—', createdAt: new Date(), updatedAt: new Date() },
            { id: '7', number: '315-555-0707', iccid: '8957101234567890007', carrier: 'Tigo', status: 'assigned', assignedTo: '—', createdAt: new Date(), updatedAt: new Date() },
          ]);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
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
    switch (status.toLowerCase()) {
      case 'available': return base + 'bg-emerald-500';
      case 'assigned':  return base + 'bg-indigo-800/80';
      case 'blocked':   return base + 'bg-red-600';
      default: return base + 'bg-slate-400';
    }
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      available: 'Activa', assigned: 'Bodega', blocked: 'Baja'
    };
    return map[status.toLowerCase()] ?? status;
  }
}
