import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationRecipient } from '../../domain/models/notification-recipient.model';
import { NotificationRecipientRepository } from '../../domain/repositories/notification-recipient.repository';

@Injectable({
  providedIn: 'root'
})
export class UpdateNotificationRecipientUseCase {
  private repository = inject(NotificationRecipientRepository);

  execute(id: string, recipient: Partial<NotificationRecipient>): Observable<NotificationRecipient> {
    return this.repository.update(id, recipient);
  }
}
