// src/config/woocommerce.js
const WooCommerceConfig = {
  // Reemplaza con la URL de tu sitio WordPress
  url: 'https://escandalosospizzas.cl/wp', // Agregar /wp aquí
  
  // Credenciales de WooCommerce (NO las subas a GitHub)
  consumerKey: 'ck_fa7a64992828f8f0efd8751fe9018cd37a4191af',
  consumerSecret: 'cs_cfb61fba55074ad1fa894542a8165616679534ab',
  
  // Versión de la API
  version: 'wc/v3',
  
  // Configuración adicional
  queryStringAuth: true, // Usa autenticación por query string (para desarrollo)
};

// Función helper para construir URLs de la API
export const getApiUrl = (endpoint) => {
  return `${WooCommerceConfig.url}/wp-json/${WooCommerceConfig.version}/${endpoint}`;
};

// Headers para las peticiones
export const getAuthHeaders = () => {
  // Para producción, usa OAuth 1.0a
  // Para desarrollo, puedes usar Basic Auth con las claves
  const auth = btoa(`${WooCommerceConfig.consumerKey}:${WooCommerceConfig.consumerSecret}`);
  
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  };
};

export default WooCommerceConfig;