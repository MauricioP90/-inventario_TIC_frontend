import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p class="text-sm text-slate-500 mt-1">Resumen general del inventario</p>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Productos -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p class="text-xs text-slate-500 font-medium">Total Productos</p>
            <p class="text-3xl font-bold text-slate-800 mt-1">245</p>
            <p class="text-[11px] text-emerald-600 font-medium mt-1">+12 este mes</p>
          </div>
          <div class="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/></svg>
          </div>
        </div>

        <!-- SIMs Activas -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p class="text-xs text-slate-500 font-medium">SIMs Activas</p>
            <p class="text-3xl font-bold text-slate-800 mt-1">120</p>
            <p class="text-[11px] text-emerald-600 font-medium mt-1">85% del total</p>
          </div>
          <div class="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          </div>
        </div>

        <!-- Movimientos Hoy -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p class="text-xs text-slate-500 font-medium">Movimientos Hoy</p>
            <p class="text-3xl font-bold text-slate-800 mt-1">8</p>
          </div>
          <div class="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
          </div>
        </div>

        <!-- Equipo Descartado -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p class="text-xs text-slate-500 font-medium">Equipo Descartado</p>
            <p class="text-3xl font-bold text-slate-800 mt-1">23</p>
          </div>
          <div class="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Inventario por Tipo (Bar Chart) -->
        <div class="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 class="text-base font-bold text-slate-800 mb-6">Inventario por Tipo</h3>
          <div class="flex items-end justify-between h-48 px-2 gap-4">
            <div class="flex flex-col items-center gap-2 flex-1 group">
              <div class="w-full bg-indigo-600 rounded-t-md transition-all group-hover:bg-indigo-500" [style.height]="'45px'"></div>
              <span class="text-[10px] text-slate-500 font-medium">Laptop</span>
            </div>
            <div class="flex flex-col items-center gap-2 flex-1 group">
              <div class="w-full bg-indigo-600 rounded-t-md transition-all group-hover:bg-indigo-500" [style.height]="'125px'"></div>
              <span class="text-[10px] text-slate-500 font-medium">Móvil</span>
            </div>
            <div class="flex flex-col items-center gap-2 flex-1 group">
              <div class="w-full bg-indigo-600 rounded-t-md transition-all group-hover:bg-indigo-500" [style.height]="'35px'"></div>
              <span class="text-[10px] text-slate-500 font-medium">Tablet</span>
            </div>
            <div class="flex flex-col items-center gap-2 flex-1 group">
              <div class="w-full bg-indigo-600 rounded-t-md transition-all group-hover:bg-indigo-500" [style.height]="'20px'"></div>
              <span class="text-[10px] text-slate-500 font-medium">Router</span>
            </div>
            <div class="flex flex-col items-center gap-2 flex-1 group">
              <div class="w-full bg-indigo-600 rounded-t-md transition-all group-hover:bg-indigo-500" [style.height]="'12px'"></div>
              <span class="text-[10px] text-slate-500 font-medium">Impresora</span>
            </div>
          </div>
        </div>

        <!-- Estado de SIM Cards (Donut Chart) -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 class="text-base font-bold text-slate-800 mb-6">Estado de SIM Cards</h3>
          <div class="flex flex-col items-center">
            <div class="relative h-40 w-40">
              <svg viewBox="0 0 36 36" class="h-full w-full rotate-[-90deg]">
                <!-- Outer circle segments -->
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" stroke-width="4"></circle>
                <!-- Activa (Emerald) -->
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" stroke-width="4" stroke-dasharray="60 40" stroke-dashoffset="0"></circle>
                <!-- Bodega (Amber) -->
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" stroke-width="4" stroke-dasharray="25 75" stroke-dashoffset="-60"></circle>
                <!-- Descartada (Red) -->
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" stroke-width="4" stroke-dasharray="15 85" stroke-dashoffset="-85"></circle>
              </svg>
            </div>
            
            <div class="flex gap-4 mt-6">
              <div class="flex items-center gap-1.5">
                <div class="h-2 w-2 rounded-full bg-amber-500"></div>
                <span class="text-[10px] text-slate-600 font-medium">Bodega</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span class="text-[10px] text-slate-600 font-medium">Activa</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="h-2 w-2 rounded-full bg-red-500"></div>
                <span class="text-[10px] text-slate-600 font-medium">Descartada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardPageComponent {}
