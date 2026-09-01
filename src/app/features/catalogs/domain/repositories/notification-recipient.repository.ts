import { Observable } from 'rxjs';
import { NotificationRecipient } from '../models/notification-recipient.model';

export abstract class NotificationRecipientRepository {
  abstract getAll(onlyActive?: boolean): Observable<NotificationRecipient[]>;
  abstract create(recipient: Omit<NotificationRecipient, 'id'>): Observable<NotificationRecipient>;
  abstract update(id: string, recipient: Partial<NotificationRecipient>): Observable<NotificationRecipient>;
  abstract delete(id: string): Observable<void>;
  abstract toggleStatus(id: string): Observable<NotificationRecipient>;
}
