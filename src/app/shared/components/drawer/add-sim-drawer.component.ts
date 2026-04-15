import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateSimCardUseCase } from '../../../features/sim-cards/application/use-cases/create-sim-card.use-case';

@Component({
  selector: 'app-add-sim-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Backdrop -->
    @if (open) {
      <div
        class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        (click)="close()"
      ></div>
    }

    <!-- Drawer panel -->
    <div
      class="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-transform duration-300"
      [class.translate-x-0]="open"
      [class.translate-x-full]="!open"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
        <div>
          <h2 class="text-base font-bold text-slate-800">Nueva SIM Card</h2>
          <p class="text-xs text-slate-500 mt-0.5">Registra una nueva tarjeta SIM en el inventario.</p>
        </div>
        <button (click)="close()" class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Form -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        @if (toast()) {
          <div [class]="toast()!.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-2.5'">
            {{ toast()!.message }}
          </div>
        }

        <!-- Número Telefónico -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Número Telefónico</label>
          <input type="text" [(ngModel)]="numero" placeholder="Ej: 310-555-0101"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
        </div>

        <!-- ICCID -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">ICCID</label>
          <input type="text" [(ngModel)]="iccid" placeholder="Ej: 8957101234567890001"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
        </div>

        <!-- Operador -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Operador</label>
          <select [(ngModel)]="operador" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="" disabled>Seleccionar operador</option>
            <option value="Claro">Claro</option>
            <option value="Movistar">Movistar</option>
            <option value="Tigo">Tigo</option>
            <option value="Wom">Wom</option>
          </select>
        </div>

        <!-- Ubicación Inicial -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Ubicación Inicial</label>
          <select [(ngModel)]="ubicacion" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="" disabled>Seleccionar ubicación</option>
            <option value="Bodega Principal">Bodega Principal</option>
            <option value="Oficina Bogotá">Oficina Bogotá</option>
            <option value="Oficina Medellín">Oficina Medellín</option>
            <option value="Taller Técnico">Taller Técnico</option>
          </select>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-slate-200 shrink-0">
        <button (click)="handleSave()"
          class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors">
          Guardar SIM
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class AddSimDrawerComponent {
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  numero = '';
  iccid = '';
  operador = '';
  ubicacion = '';
  toast = signal<{ type: 'success' | 'error', message: string } | null>(null);

  constructor(private createSimCard: CreateSimCardUseCase) { }

  close() {
    this.openChange.emit(false);
  }

  handleSave() {
    this.toast.set(null);
    if (!this.numero || !this.iccid || !this.operador || !this.ubicacion) {
      this.toast.set({ type: 'error', message: 'Por favor completa todos los campos.' });
      return;
    }

    const dto = {
      numero: this.numero,
      iccid: this.iccid,
      operador: this.operador,
      estado: 'BODEGA' as 'BODEGA'
    };

    this.createSimCard.execute(dto).subscribe({
      next: () => {
        this.toast.set({ type: 'success', message: `SIM "${this.numero}" guardada exitosamente.` });
        this.resetForm();
        setTimeout(() => { 
          this.close(); 
          this.saved.emit(); 
        }, 1200);
      },
      error: (err) => {
        this.toast.set({ type: 'error', message: err.message || 'Error al guardar la SIM' });
      }
    });
  }

  private resetForm() {
    this.numero = '';
    this.iccid = '';
    this.operador = '';
    this.ubicacion = '';
  }
}
