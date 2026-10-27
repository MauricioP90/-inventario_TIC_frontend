import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reports-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50" *ngIf="currentListLength > 0">
      <div class="flex items-center gap-3 text-xs text-slate-500">
        <span>Mostrando <strong>{{ startIndex }}</strong> a <strong>{{ endIndex }}</strong> de <strong>{{ currentListLength }}</strong> registros</span>
        <select
          [ngModel]="pageSize"
          (ngModelChange)="onPageSizeChange($event)"
          class="px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <option [value]="5">5 por página</option>
          <option [value]="10">10 por página</option>
          <option [value]="25">25 por página</option>
          <option [value]="50">50 por página</option>
        </select>
      </div>
      <div class="flex items-center gap-1">
        <button
          (click)="prevPage.emit()"
          [disabled]="currentPage === 1"
          class="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors border border-slate-200 bg-white font-medium"
        >← Anterior</button>
        <span class="px-3 py-1.5 text-xs font-bold text-indigo-600">{{ currentPage }} / {{ totalPages }}</span>
        <button
          (click)="nextPage.emit()"
          [disabled]="currentPage === totalPages"
          class="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors border border-slate-200 bg-white font-medium"
        >Siguiente →</button>
      </div>
    </div>
  `
})
export class ReportsPaginationComponent {
  @Input() currentListLength: number = 0;
  @Input() startIndex: number = 0;
  @Input() endIndex: number = 0;
  @Input() pageSize: number = 10;
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;

  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() prevPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();

  onPageSizeChange(val: any) {
    this.pageSizeChange.emit(Number(val));
  }
}
