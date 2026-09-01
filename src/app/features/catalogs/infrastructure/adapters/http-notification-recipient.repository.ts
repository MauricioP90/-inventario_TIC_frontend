import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationRecipient } from '../../domain/models/notification-recipient.model';
import { NotificationRecipientRepository } from '../../domain/repositories/notification-recipient.repository';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpNotificationRecipientRepository implements NotificationRecipientRepository {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notification-recipients`;

  getAll(onlyActive?: boolean): Observable<NotificationRecipient[]> {
    const params: any = {};
    if (onlyActive) {
      params.active = 'true';
    }
    return this.http.get<NotificationRecipient[]>(this.apiUrl, { params, withCredentials: true });
  }

  create(recipient: Omit<NotificationRecipient, 'id'>): Observable<NotificationRecipient> {
    return this.http.post<NotificationRecipient>(this.apiUrl, recipient, { withCredentials: true });
  }

  update(id: string, recipient: Partial<NotificationRecipient>): Observable<NotificationRecipient> {
    return this.http.put<NotificationRecipient>(`${this.apiUrl}/${id}`, recipient, { withCredentials: true });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  toggleStatus(id: string): Observable<NotificationRecipient> {
    return this.http.patch<NotificationRecipient>(`${this.apiUrl}/${id}/toggle`, {}, { withCredentials: true });
  }
}
