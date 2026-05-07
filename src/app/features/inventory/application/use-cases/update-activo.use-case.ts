import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Activo } from "../../domain/models/activo.model";
import { environment } from "../../../../../environments/environment";


@Injectable({
    providedIn: 'root'
})
export class UpdateActivoUseCase {
    constructor(private readonly http: HttpClient) { }

    execute(placa: string, data: Partial<Activo>): Observable<Activo> {
        // El backend espera un PUT a /api/activos/:placa
        return this.http.put<Activo>(`${environment.apiUrl}/activos/${placa}`, data);
    }
}