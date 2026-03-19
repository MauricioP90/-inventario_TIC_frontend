import { Observable } from 'rxjs';
import { Product, CreateProductDto, UpdateProductDto } from '../models/product.model';

export abstract class ProductRepository {
  abstract getAll(): Observable<Product[]>;
  abstract getById(id: string): Observable<Product>;
  abstract create(product: CreateProductDto): Observable<Product>;
  abstract update(id: string, product: UpdateProductDto): Observable<Product>;
  abstract delete(id: string): Observable<void>;
}
