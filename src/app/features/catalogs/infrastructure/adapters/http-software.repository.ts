import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SoftwareRepository } from '../../domain/repositories/software.repository';
import {
    SoftwareApp,
    SoftwareVersion,
    CreateSoftwareAppDto,
    AddSoftwareVersionDto,
    InstalledSoftwareEvaluation,
    SoftwareHistoryDetail,
    InstallSoftwareDto,
    UpgradeSoftwareDto,
    RetireSoftwareDto
} from '../../domain/models/software.model';

@Injectable({ providedIn: 'root' })
export class HttpSoftwareRepository implements SoftwareRepository {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/software`;

    getAllApps(): Observable<SoftwareApp[]> {
        return this.http.get<SoftwareApp[]>(`${this.baseUrl}/apps`);
    }

    createApp(dto: CreateSoftwareAppDto): Observable<SoftwareApp> {
        return this.http.post<SoftwareApp>(`${this.baseUrl}/apps`, dto);
    }

    getAppVersions(appId: string): Observable<SoftwareVersion[]> {
        return this.http.get<SoftwareVersion[]>(`${this.baseUrl}/apps/${appId}/versions`);
    }

    addAppVersion(appId: string, dto: AddSoftwareVersionDto): Observable<SoftwareVersion> {
        return this.http.post<SoftwareVersion>(`${this.baseUrl}/apps/${appId}/versions`, dto);
    }

    setVigenteVersion(versionId: string): Observable<SoftwareVersion> {
        return this.http.put<SoftwareVersion>(`${this.baseUrl}/versions/${versionId}/vigente`, {});
    }

    getInstalledSoftware(activoId: string): Observable<InstalledSoftwareEvaluation[]> {
        return this.http.get<InstalledSoftwareEvaluation[]>(`${this.baseUrl}/activos/${activoId}/installed`);
    }

    getSoftwareHistory(activoId: string): Observable<SoftwareHistoryDetail[]> {
        return this.http.get<SoftwareHistoryDetail[]>(`${this.baseUrl}/activos/${activoId}/history`);
    }

    installSoftware(activoId: string, dto: InstallSoftwareDto): Observable<any> {
        return this.http.post(`${this.baseUrl}/activos/${activoId}/install`, dto);
    }

    upgradeSoftware(activoId: string, dto: UpgradeSoftwareDto): Observable<any> {
        return this.http.put(`${this.baseUrl}/activos/${activoId}/upgrade`, dto);
    }

    retireSoftware(historyId: string, dto: RetireSoftwareDto): Observable<any> {
        return this.http.put(`${this.baseUrl}/history/${historyId}/retire`, dto);
    }
}
