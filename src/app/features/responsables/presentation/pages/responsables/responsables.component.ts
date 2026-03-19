import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Responsable } from '../../../domain/models/responsable.model';
import { GetAllResponsablesUseCase } from '../../../application/use-cases/get-all-responsables.use-case';

@Component({
  selector: 'app-responsables-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
          <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Responsables</h1>
          <p class="text-sm text-slate-500">Gestión de responsables y encargados de equipos</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- New Responsable Form -->
        <div class="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-fit">
          <div class="flex items-center gap-2 mb-6">
            <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <h2 class="text-base font-semibold text-slate-800">Nuevo Responsable</h2>
          </div>

          <form (submit)="saveResponsable($event)" class="space-y-4">
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Nombre Completo</label>
              <input type="text" [(ngModel)]="newName" name="name" 
                     placeholder="Ej: Laura Gómez"
                     class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Teléfono</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                </span>
                <input type="text" [(ngModel)]="newPhone" name="phone"
                       placeholder="310-555-0000"
                       class="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Correo Electrónico</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </span>
                <input type="email" [(ngModel)]="newEmail" name="email"
                       placeholder="correo@flotamacarena.com"
                       class="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
              </div>
            </div>
            <button type="submit"
                    class="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
              Guardar Responsable
            </button>
          </form>
        </div>

        <!-- Assign Responsable Form -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-fit">
          <div class="flex items-center gap-2 mb-6">
            <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h2 class="text-base font-semibold text-slate-800">Asignar Responsable a Ubicación</h2>
          </div>

          <div class="space-y-4">
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Ubicación</label>
              <select [(ngModel)]="selectedLocation"
                      class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all">
                <option value="">Seleccionar ubicación</option>
                @for (loc of locations; track loc) {
                  <option [value]="loc">{{ loc }}</option>
                }
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Responsable</label>
              <select [(ngModel)]="selectedResponsableId"
                      class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all">
                <option value="">Seleccionar responsable</option>
                @for (r of responsables(); track r.id) {
                  <option [value]="r.id">{{ r.name }}</option>
                }
              </select>
            </div>
            <button (click)="assignResponsable()"
                    class="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              Asignar a Ubicación
            </button>
          </div>
        </div>

        <!-- Responsables List -->
        <div class="lg:col-span-2 space-y-4">
          <p class="text-sm font-medium text-slate-500">{{ responsables().length }} responsables registrados</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (r of responsables(); track r.id) {
              <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div class="flex items-start gap-3 mb-4">
                  <div class="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                    {{ getInitials(r.name) }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-slate-800 truncate">{{ r.name }}</p>
                    <p class="text-xs text-slate-500 truncate">{{ r.email }}</p>
                  </div>
                </div>
                <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div class="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-full">
                    <svg class="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span class="text-[11px] font-medium text-slate-600">{{ r.location || 'Sin asignar' }}</span>
                  </div>
                  <span class="text-xs text-slate-500 font-medium">{{ r.equipmentCount }} equipos</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ResponsablesPageComponent implements OnInit {
  responsables = signal<Responsable[]>([]);
  locations = ["Oficina Bogotá", "Oficina Medellín", "Oficina Cali", "Bodega Principal", "Taller Técnico"];
  
  // New Responsable state
  newName = '';
  newPhone = '';
  newEmail = '';

  // Assign state
  selectedLocation = '';
  selectedResponsableId = '';

  constructor(private getAllResponsables: GetAllResponsablesUseCase) {}

  ngOnInit() {
    this.getAllResponsables.execute().subscribe(data => {
      if (data.length > 0) {
        this.responsables.set(data);
      } else {
        // Mock data if empty
        this.responsables.set([
          { id: '1', name: 'Carlos Pérez', email: 'carlos.perez@flotamacarena.com', phone: '310-555-0101', location: 'Oficina Bogotá', equipmentCount: 5, role: 'user', status: 'active', createdAt: new Date(), updatedAt: new Date() },
          { id: '2', name: 'María López', email: 'maria.lopez@flotamacarena.com', phone: '311-555-0202', location: 'Oficina Medellín', equipmentCount: 3, role: 'user', status: 'active', createdAt: new Date(), updatedAt: new Date() },
          { id: '3', name: 'Juan García', email: 'juan.garcia@flotamacarena.com', phone: '312-555-0303', location: 'Bodega Principal', equipmentCount: 8, role: 'user', status: 'active', createdAt: new Date(), updatedAt: new Date() },
          { id: '4', name: 'Ana Martínez', email: 'ana.martinez@flotamacarena.com', phone: '320-555-0404', location: 'Oficina Cali', equipmentCount: 2, role: 'user', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        ]);
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  saveResponsable(event: Event) {
    event.preventDefault();
    if (!this.newName || !this.newPhone || !this.newEmail) return;

    const newResp: Responsable = {
      id: Date.now().toString(),
      name: this.newName,
      phone: this.newPhone,
      email: this.newEmail,
      location: 'Sin asignar',
      equipmentCount: 0,
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.responsables.update(prev => [newResp, ...prev]);
    this.newName = '';
    this.newPhone = '';
    this.newEmail = '';
  }

  assignResponsable() {
    if (!this.selectedLocation || !this.selectedResponsableId) return;

    this.responsables.update(prev => 
      prev.map(r => r.id === this.selectedResponsableId ? { ...r, location: this.selectedLocation } : r)
    );

    this.selectedLocation = '';
    this.selectedResponsableId = '';
  }
}
