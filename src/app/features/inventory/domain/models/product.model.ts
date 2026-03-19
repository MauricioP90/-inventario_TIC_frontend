export interface Product {
  id: string;
  placa: string;
  type: string;
  model: string;
  serial: string;
  location: string;
  status: 'available' | 'assigned' | 'maintenance' | 'disposed';
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductDto = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductDto = Partial<CreateProductDto>;
