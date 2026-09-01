import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationRecipient } from '../../domain/models/notification-recipient.model';
import { NotificationRecipientRepository } from '../../domain/repositories/notification-recipient.repository';

@Injectable({
  providedIn: 'root'
})
export class ToggleNotificationRecipientUseCase {
  private repository = inject(NotificationRecipientRepository);

  execute(id: string): Observable<NotificationRecipient> {
    return this.repository.toggleStatus(id);
  }
}
