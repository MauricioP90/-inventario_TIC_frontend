import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationRecipientRepository } from '../../domain/repositories/notification-recipient.repository';

@Injectable({
  providedIn: 'root'
})
export class DeleteNotificationRecipientUseCase {
  private repository = inject(NotificationRecipientRepository);

  execute(id: string): Observable<void> {
    return this.repository.delete(id);
  }
}
