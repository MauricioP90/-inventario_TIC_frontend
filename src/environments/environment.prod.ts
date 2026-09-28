export const environment = {
  production: true,
  // En producción con Nginx / Reverse Proxy se usa '/api', o dinámico según el host de acceso
  apiUrl: typeof window !== 'undefined' && (!window.location.port || window.location.port === '80' || window.location.port === '443')
    ? '/api'
    : (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3000/api` : 'http://localhost:3000/api'),
  keycloak: {
    url: typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:8180`
      : 'http://localhost:8180',
    realm: 'Inventory-realm',
    clientId: 'inventory-backend'
  }
};
