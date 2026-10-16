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
  selectedFile = signal<{ file: File; base64: string; name: string; sizeFormatted: string } | null>(null);
  fileError = signal<string>('');

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

  onFileSelected(event: Event) {
    this.fileError.set('');
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
    const ext = (file.name.split('.').pop() || '').toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      this.fileError.set('Formato no permitido. Solo se aceptan archivos PDF, PNG o JPG.');
      input.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      this.fileError.set('El archivo excede el tamaño máximo permitido de 5 MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const sizeKB = Math.round(file.size / 1024);
      const sizeFormatted = sizeKB > 1024 
        ? `${(sizeKB / 1024).toFixed(1)} MB` 
        : `${sizeKB} KB`;

      this.selectedFile.set({
        file,
        base64,
        name: file.name,
        sizeFormatted
      });
    };
    reader.onerror = () => {
      this.fileError.set('No se pudo leer el archivo seleccionado.');
    };
    reader.readAsDataURL(file);
  }

  removeSelectedFile() {
    this.selectedFile.set(null);
    this.fileError.set('');
  }

  confirmReception() {
    if (!this.physicalReceiverName.trim()) {
      alert('Por favor, ingresa tu nombre para confirmar la recepción.');
      return;
    }
    this.loading.set(true);

    const payload: any = {
      physicalReceiverName: this.physicalReceiverName.trim()
    };

    if (this.selectedFile()) {
      payload.evidenceFile = {
        base64: this.selectedFile()!.base64,
        fileName: this.selectedFile()!.name
      };
    }

    this.http.post(`${environment.apiUrl}/movements/public/magic-link/${this.token}/receive`, payload).subscribe({
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
