import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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
export class GetAllSoftwareAppsUseCase {
    private repo = inject(SoftwareRepository);
    execute(): Observable<SoftwareApp[]> {
        return this.repo.getAllApps();
    }
}

@Injectable({ providedIn: 'root' })
export class CreateSoftwareAppUseCase {
    private repo = inject(SoftwareRepository);
    execute(dto: CreateSoftwareAppDto): Observable<SoftwareApp> {
        return this.repo.createApp(dto);
    }
}

@Injectable({ providedIn: 'root' })
export class GetAppVersionsUseCase {
    private repo = inject(SoftwareRepository);
    execute(appId: string): Observable<SoftwareVersion[]> {
        return this.repo.getAppVersions(appId);
    }
}

@Injectable({ providedIn: 'root' })
export class AddSoftwareVersionUseCase {
    private repo = inject(SoftwareRepository);
    execute(appId: string, dto: AddSoftwareVersionDto): Observable<SoftwareVersion> {
        return this.repo.addAppVersion(appId, dto);
    }
}

@Injectable({ providedIn: 'root' })
export class SetVigenteVersionUseCase {
    private repo = inject(SoftwareRepository);
    execute(versionId: string): Observable<SoftwareVersion> {
        return this.repo.setVigenteVersion(versionId);
    }
}

@Injectable({ providedIn: 'root' })
export class GetActivoInstalledSoftwareUseCase {
    private repo = inject(SoftwareRepository);
    execute(activoId: string): Observable<InstalledSoftwareEvaluation[]> {
        return this.repo.getInstalledSoftware(activoId);
    }
}

@Injectable({ providedIn: 'root' })
export class GetActivoSoftwareHistoryUseCase {
    private repo = inject(SoftwareRepository);
    execute(activoId: string): Observable<SoftwareHistoryDetail[]> {
        return this.repo.getSoftwareHistory(activoId);
    }
}

@Injectable({ providedIn: 'root' })
export class InstallActivoSoftwareUseCase {
    private repo = inject(SoftwareRepository);
    execute(activoId: string, dto: InstallSoftwareDto): Observable<any> {
        return this.repo.installSoftware(activoId, dto);
    }
}

@Injectable({ providedIn: 'root' })
export class UpgradeActivoSoftwareUseCase {
    private repo = inject(SoftwareRepository);
    execute(activoId: string, dto: UpgradeSoftwareDto): Observable<any> {
        return this.repo.upgradeSoftware(activoId, dto);
    }
}

@Injectable({ providedIn: 'root' })
export class RetireActivoSoftwareUseCase {
    private repo = inject(SoftwareRepository);
    execute(historyId: string, dto: RetireSoftwareDto): Observable<any> {
        return this.repo.retireSoftware(historyId, dto);
    }
}
