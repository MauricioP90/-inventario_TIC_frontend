import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium select-none" *ngIf="totalActivos > 0">
      <!-- Rango actual -->
      <div>
        Mostrando <span class="font-bold text-slate-700">{{ startIndex }}</span> a 
        <span class="font-bold text-slate-700">{{ endIndex }}</span> de 
        <span class="font-bold text-slate-700">{{ totalActivos }}</span> activos
      </div>
      
      <!-- Controles -->
      <div class="flex items-center gap-4">
        <!-- Selector de cantidad por página -->
        <div class="flex items-center gap-1.5">
          <span>Filas por página:</span>
          <select 
            [ngModel]="pageSize" 
            (ngModelChange)="pageSizeChange.emit(+$event)"
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
            (click)="prevPage.emit()" 
            [disabled]="currentPage === 1"
            class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold">
            ‹
          </button>
          <span class="text-slate-600 font-bold px-1">Pág. {{ currentPage }} de {{ totalPages }}</span>
          <button 
            (click)="nextPage.emit()" 
            [disabled]="currentPage === totalPages"
            class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold">
            ›
          </button>
        </div>
      </div>
    </div>
  `
})
export class InventoryPaginationComponent {
  @Input() startIndex: number = 0;
  @Input() endIndex: number = 0;
  @Input() totalActivos: number = 0;
  @Input() pageSize: number = 10;
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;

  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() prevPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
}
