import { Observable } from 'rxjs';
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
} from '../models/software.model';

export abstract class SoftwareRepository {
    abstract getAllApps(): Observable<SoftwareApp[]>;
    abstract createApp(dto: CreateSoftwareAppDto): Observable<SoftwareApp>;
    abstract getAppVersions(appId: string): Observable<SoftwareVersion[]>;
    abstract addAppVersion(appId: string, dto: AddSoftwareVersionDto): Observable<SoftwareVersion>;
    abstract setVigenteVersion(versionId: string): Observable<SoftwareVersion>;
    abstract getInstalledSoftware(activoId: string): Observable<InstalledSoftwareEvaluation[]>;
    abstract getSoftwareHistory(activoId: string): Observable<SoftwareHistoryDetail[]>;
    abstract installSoftware(activoId: string, dto: InstallSoftwareDto): Observable<any>;
    abstract upgradeSoftware(activoId: string, dto: UpgradeSoftwareDto): Observable<any>;
    abstract retireSoftware(historyId: string, dto: RetireSoftwareDto): Observable<any>;
}
