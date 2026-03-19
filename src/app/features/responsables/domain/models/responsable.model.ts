export interface Responsable {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive';
  location?: string;
  equipmentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateResponsableDto = Omit<Responsable, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateResponsableDto = Partial<CreateResponsableDto>;
