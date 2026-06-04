import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-magic-link-receive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './magic-link-receive.component.html',
  styles: []
})
export class MagicLinkReceiveComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  
  token = '';
  movement = signal<any>(null);
  loading = signal(true);
  error = signal('');
  success = signal(false);
  rejected = signal(false);
  showRejectForm = signal(false);
  
  physicalReceiverName = '';
  rejectionReason = '';

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.error.set('Token no proporcionado.');
      this.loading.set(false);
      return;
    }
    this.loadMovementDetails();
  }

  loadMovementDetails() {
    this.http.get(`${environment.apiUrl}/movements/public/magic-link/${this.token}`)
      .subscribe({
        next: (data) => {
          this.movement.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'El enlace es inválido o el equipo ya fue recibido.');
          this.loading.set(false);
        }
      });
  }

  confirmReception() {
    if (!this.physicalReceiverName.trim()) {
      alert('Por favor, ingresa tu nombre para confirmar la recepción.');
      return;
    }
    this.loading.set(true);
    this.http.post(`${environment.apiUrl}/movements/public/magic-link/${this.token}/receive`, {
      physicalReceiverName: this.physicalReceiverName
    }).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al confirmar la recepción.');
        this.loading.set(false);
      }
    });
  }

  confirmRejection() {
    if (!this.rejectionReason.trim()) {
      alert('Por favor, ingresa el motivo del rechazo.');
      return;
    }
    this.loading.set(true);
    this.http.post(`${environment.apiUrl}/movements/public/magic-link/${this.token}/reject`, {
      rejectionReason: this.rejectionReason
    }).subscribe({
      next: () => {
        this.rejected.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al rechazar el envío.');
        this.loading.set(false);
      }
    });
  }

  get activosList(): any[] {
    return this.movement()?.activos || [];
  }

  get destinationResponsible(): string {
    const m = this.movement();
    return m?.responsible?.nombre || 'Responsable de la Sede';
  }
}
