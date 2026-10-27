import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface FileUploadResult {
  url: string;
}

export type FileUploadFolder = 'facturas' | 'soportes' | 'evidencias' | 'mantenimiento' | (string & {});

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/files/upload`;

  /**
   * Lee un archivo en Base64 y lo sube al backend de manera desacoplada del UI.
   * @param file Archivo File obtenido del input o drag-and-drop
   * @param folder Carpeta de destino ('facturas', 'soportes', 'evidencias', 'mantenimiento')
   * @param maxSizeBytes Tamaño máximo permitido en bytes (por defecto 5MB)
   */
  upload(
    file: File,
    folder: FileUploadFolder = 'soportes',
    maxSizeBytes: number = 5 * 1024 * 1024
  ): Observable<FileUploadResult> {
    if (file.size > maxSizeBytes) {
      const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
      return throwError(() => new Error(`El archivo no puede superar los ${maxMb}MB.`));
    }

    return from(this.readFileAsBase64(file)).pipe(
      switchMap(base64 =>
        this.http.post<FileUploadResult>(this.apiUrl, {
          base64,
          fileName: file.name,
          folder
        })
      )
    );
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Error al leer el archivo seleccionado.'));
      reader.readAsDataURL(file);
    });
  }
}
