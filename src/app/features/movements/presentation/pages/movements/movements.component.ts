import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PickItem {
  placa: string;
  type: string;
  model: string;
  serial: string;
}

const mockEquipmentDB: PickItem[] = [
  { placa: "FLM-001", type: "Laptop", model: "Dell Latitude 5540", serial: "SN-DL5540-001" },
  { placa: "FLM-002", type: "Móvil", model: "Samsung Galaxy A54", serial: "SN-SGA54-002" },
  { placa: "FLM-003", type: "Tablet", model: "iPad Air 5th Gen", serial: "SN-IPA5-003" },
  { placa: "FLM-004", type: "Laptop", model: "Lenovo ThinkPad T14", serial: "SN-LTP14-004" },
  { placa: "FLM-005", type: "Móvil", model: "iPhone 14", serial: "SN-IP14-005" },
  { placa: "FLM-006", type: "Tablet", model: "Samsung Tab S9", serial: "SN-STS9-006" },
];

@Component({
  selector: 'app-movements-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
          <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Nuevo Movimiento</h1>
          <p class="text-sm text-slate-500">Registra transferencias y asignaciones de equipos</p>
        </div>
      </div>

      <!-- Movement Type & Responsible -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700">Tipo de Movimiento</label>
          <select [(ngModel)]="movementType"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all">
            <option value="">Seleccionar tipo...</option>
            <option value="assignment">Asignación a Oficina</option>
            <option value="transfer">Transferencia Regional</option>
            <option value="disposal">Baja de Activo</option>
            <option value="repair">Envío a Reparación</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700">Responsable</label>
          <select [(ngModel)]="responsible"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all">
            <option value="">Seleccionar responsable...</option>
            <option value="1">Carlos Pérez</option>
            <option value="2">María López</option>
            <option value="3">Juan García</option>
          </select>
        </div>
      </div>

      <!-- Origin / Destination -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        <div class="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-xl p-5">
          <div class="flex items-center gap-2 mb-3 text-indigo-700">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span class="text-sm font-bold">Origen</span>
          </div>
          <select [(ngModel)]="origin"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all">
            <option value="">Ubicación de origen...</option>
            <option value="bodega">Bodega Central</option>
            <option value="bogota">Oficina Bogotá</option>
            <option value="medellin">Oficina Medellín</option>
          </select>
        </div>

        <div class="bg-emerald-50/50 border-2 border-dashed border-emerald-200 rounded-xl p-5">
          <div class="flex items-center gap-2 mb-3 text-emerald-700">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span class="text-sm font-bold">Destino</span>
          </div>
          <select [(ngModel)]="destination"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all">
            <option value="">Ubicación de destino...</option>
            <option value="bodega">Bodega Central</option>
            <option value="bogota">Oficina Bogotá</option>
            <option value="medellin">Oficina Medellín</option>
          </select>
        </div>

        <!-- Center arrows -->
        <div class="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div class="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          </div>
        </div>
      </div>

      <!-- Picking List -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div class="flex items-center gap-2 mb-4">
          <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <h2 class="text-base font-semibold text-slate-800">Lista de Equipos</h2>
        </div>

        <!-- Search input -->
        <div class="relative mb-6">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" [(ngModel)]="searchQuery" 
                 (keydown.enter)="addItem()"
                 placeholder="Escanear código o buscar por placa / serial... (Enter para agregar)"
                 class="w-full pl-10 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-base transition-all">
        </div>

        <!-- Items list -->
        @if (pickList().length === 0) {
          <div class="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
            <svg class="h-10 w-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
            <p class="font-medium">Sin equipos agregados</p>
            <p class="text-sm mt-1">Escanea o busca equipos por placa o serial</p>
          </div>
        } @else {
          <div class="space-y-2">
            @for (item of pickList(); track item.placa; let i = $index) {
              <div class="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white transition-colors group">
                <div class="flex items-center gap-3">
                  <span class="text-slate-400 text-sm font-mono w-6 text-right">{{ i + 1 }}.</span>
                  <div class="h-8 w-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-indigo-600">
                    @switch (item.type) {
                      @case ('Laptop') { <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9.75 17L9 20l-1 .5h8l-1-.5-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> }
                      @case ('Móvil') { <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg> }
                      @case ('Tablet') { <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg> }
                    }
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-sm text-slate-800">{{ item.placa }}</span>
                      <span class="bg-indigo-100 text-indigo-700 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">{{ item.type }}</span>
                    </div>
                    <p class="text-[11px] text-slate-500">{{ item.model }}</p>
                  </div>
                </div>
                <button (click)="removeItem(item.placa)"
                        class="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            }
            <div class="flex justify-between items-center pt-2 px-1 text-xs text-slate-500">
              <span>{{ pickList().length }} equipo(s) en lista</span>
            </div>
          </div>
        }
      </div>

      <!-- Save Button -->
      <button (click)="saveMovement()"
              class="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
        Guardar Movimiento
      </button>
    </div>
  `,
  styles: []
})
export class MovementsPageComponent {
  movementType = '';
  responsible = '';
  origin = '';
  destination = '';
  searchQuery = '';
  pickList = signal<PickItem[]>([]);

  addItem() {
    if (!this.searchQuery.trim()) return;

    const query = this.searchQuery.toUpperCase();
    const found = mockEquipmentDB.find(e => e.placa.includes(query) || e.serial.includes(query));

    if (found) {
      if (this.pickList().some(item => item.placa === found.placa)) {
        alert('Este equipo ya está en la lista');
      } else {
        this.pickList.update(prev => [...prev, found]);
      }
    } else {
      alert('Equipo no encontrado');
    }
    this.searchQuery = '';
  }

  removeItem(placa: string) {
    this.pickList.update(prev => prev.filter(i => i.placa !== placa));
  }

  saveMovement() {
    if (!this.movementType || !this.responsible || !this.origin || !this.destination || this.pickList().length === 0) {
      alert('Completa todos los campos y agrega al menos un equipo');
      return;
    }
    alert('Movimiento guardado exitosamente');
    this.pickList.set([]);
    this.movementType = '';
    this.responsible = '';
    this.origin = '';
    this.destination = '';
  }
}
