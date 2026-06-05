import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { 
  provideKeycloak, 
  includeBearerTokenInterceptor, 
  createInterceptorCondition, 
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  IncludeBearerTokenCondition
} from 'keycloak-angular';
import { environment } from '../environments/environment';
import { SimCardRepository } from './features/sim-cards/domain/repositories/sim-card.repository';
import { HttpSimCardRepository } from './features/sim-cards/infrastructure/adapters/http-sim-card.repository';
import { MovementRepository } from './features/movements/domain/repositories/movement.repository';
import { HttpMovementRepository } from './features/movements/infrastructure/adapters/http-movement.repository';
import { ResponsableRepository } from './features/responsables/domain/repositories/responsable.repository';
import { HttpResponsableRepository } from './features/responsables/infrastructure/adapters/http-responsable.repository';
import { ActivoRepository } from './features/inventory/domain/repositories/activo.repository';
import { HttpActivoRepository } from './features/inventory/infrastructure/adapters/http-activo.repository';
import { LocationRepository } from './features/locations/domain/repositories/location.repository';
import { HttpLocationRepository } from './features/locations/infrastructure/adapters/http-location.repository';
import { GeocodingRepository } from './features/locations/domain/repositories/geocoding.repository';
import { NominatimGeocodingRepository } from './features/locations/infrastructure/adapters/nominatim-geocoding.repository';

// Condición para incluir el token en las peticiones al backend
const urlCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
  urlPattern: /^(http:\/\/localhost:3000\/api)(\/.*)?$/i,
  bearerPrefix: 'Bearer'
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
    provideKeycloak({
      config: {
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
        checkLoginIframe: false
      }
    }),
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [urlCondition]
    },
    { provide: LocationRepository, useClass: HttpLocationRepository },
    { provide: ActivoRepository, useClass: HttpActivoRepository },
    { provide: SimCardRepository, useClass: HttpSimCardRepository },
    { provide: MovementRepository, useClass: HttpMovementRepository },
    { provide: ResponsableRepository, useClass: HttpResponsableRepository },
    { provide: GeocodingRepository, useClass: NominatimGeocodingRepository }
  ],
};
