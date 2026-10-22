import { Observable } from 'rxjs';
import { Movement, CreateMovementDto } from '../models/movement.model';

export abstract class MovementRepository {
  abstract getAll(): Observable<Movement[]>;
  abstract getById(id: string): Observable<Movement>;
  abstract create(movement: CreateMovementDto): Observable<Movement>;
  abstract dispatch(id: string, evidenceUrl?: string, documentUrl?: string, recipients?: string[], notifyWhatsApp?: boolean): Observable<Movement>;
  abstract receive(id: string, receiverId: string, receiverEvidenceUrl: string, destinationLocationId?: string): Observable<Movement>;
  abstract reject(id: string, rejectionReason: string): Observable<Movement>;
  abstract updateNotes(id: string, notes: string): Observable<Movement>;
  abstract cancel(id: string, reason: string): Observable<Movement>;
  abstract attachDocuments(id: string, data: { documentUrl?: string; receivedEvidenceUrl?: string; notes?: string }): Observable<Movement>;
}
