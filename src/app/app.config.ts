import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { ProductRepository } from './features/inventory/domain/repositories/product.repository';
import { HttpProductRepository } from './features/inventory/infrastructure/adapters/http-product.repository';
import { SimCardRepository } from './features/sim-cards/domain/repositories/sim-card.repository';
import { HttpSimCardRepository } from './features/sim-cards/infrastructure/adapters/http-sim-card.repository';
import { MovementRepository } from './features/movements/domain/repositories/movement.repository';
import { HttpMovementRepository } from './features/movements/infrastructure/adapters/http-movement.repository';
import { ResponsableRepository } from './features/responsables/domain/repositories/responsable.repository';
import { HttpResponsableRepository } from './features/responsables/infrastructure/adapters/http-responsable.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    { provide: ProductRepository,    useClass: HttpProductRepository },
    { provide: SimCardRepository,    useClass: HttpSimCardRepository },
    { provide: MovementRepository,   useClass: HttpMovementRepository },
    { provide: ResponsableRepository, useClass: HttpResponsableRepository },
  ],
};
