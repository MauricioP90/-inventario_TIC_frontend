export interface SoftwareApp {
    id: string;
    nombre: string;
    descripcion?: string;
    estado: 'ACTIVO' | 'INACTIVO';
    createdAt?: string;
    updatedAt?: string;
}

export interface SoftwareVersion {
    id: string;
    softwareAppId: string;
    version: string;
    esVigente: boolean;
    notasLanzamiento?: string;
    fechaLanzamiento: string;
    createdAt?: string;
}

export interface CreateSoftwareAppDto {
    nombre: string;
    descripcion?: string;
    estado?: 'ACTIVO' | 'INACTIVO';
}

export interface AddSoftwareVersionDto {
    version: string;
    esVigente?: boolean;
    notasLanzamiento?: string;
    fechaLanzamiento?: string;
}

export interface InstalledSoftwareEvaluation {
    historyId: string;
    activoId: string;
    appId: string;
    appName: string;
    versionId: string;
    installedVersion: string;
    vigenteVersion: string | null;
    semaforo: 'AL_DIA' | 'DESACTUALIZADO' | 'BETA' | 'SIN_VIGENTE';
    licencia?: string;
    fechaInstalacion: string;
    instaladoPor: string;
    observaciones?: string;
}

export interface SoftwareHistoryDetail {
    historyId: string;
    activoId: string;
    appId: string;
    appName: string;
    version: string;
    estado: string;
    licencia?: string;
    fechaInstalacion: string;
    fechaRetiro?: string;
    instaladoPor: string;
    retiradoPor?: string;
    observaciones?: string;
}

export interface InstallSoftwareDto {
    softwareVersionId: string;
    licencia?: string;
    observaciones?: string;
}

export interface UpgradeSoftwareDto {
    newSoftwareVersionId: string;
    licencia?: string;
    observaciones?: string;
}

export interface RetireSoftwareDto {
    motivoRetiro?: string;
}
