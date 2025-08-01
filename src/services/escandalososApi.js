// src/services/escandalososApi.js

class EscandalososAPI {
  constructor() {
    // URL base de la API del plugin Escandalosos
    this.baseUrl = 'https://escandalosospizzas.cl/wp/wp-json/escandalosos/v1';
    
    // Cache para evitar llamadas repetidas
    this.cache = {
      config: null,
      lastFetch: null,
      cacheTime: 5 * 60 * 1000 // 5 minutos de cache
    };
  }

  // Método genérico para hacer peticiones
  async request(endpoint, method = 'GET', data = null) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      console.log('Escandalosos API Request:', url);

      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData;
      
    } catch (error) {
      console.error('Error en la petición a Escandalosos API:', error);
      throw error;
    }
  }

  // Obtener toda la configuración del plugin
  async getConfig(forceRefresh = false) {
    // Verificar cache
    if (!forceRefresh && this.cache.config && this.cache.lastFetch) {
      const now = new Date().getTime();
      if (now - this.cache.lastFetch < this.cache.cacheTime) {
        console.log('Devolviendo configuración desde cache');
        return this.cache.config;
      }
    }

    try {
      const config = await this.request('/config');
      
      // Guardar en cache
      this.cache.config = config;
      this.cache.lastFetch = new Date().getTime();
      
      console.log('Configuración Escandalosos obtenida:', config);
      return config;
      
    } catch (error) {
      console.error('Error obteniendo configuración:', error);
      
      // Si hay configuración en cache, devolverla aunque esté expirada
      if (this.cache.config) {
        console.warn('Devolviendo configuración desde cache expirado');
        return this.cache.config;
      }
      
      // Devolver configuración vacía si no hay nada
      return {
        products: {},
        labels: []
      };
    }
  }

  // Obtener configuración de un producto específico
  async getProductConfig(productId) {
    const config = await this.getConfig();
    return config.products[productId] || null;
  }

  // Verificar si un producto es combo
  async isCombo(productId) {
    const productConfig = await this.getProductConfig(productId);
    return productConfig?.is_combo || false;
  }

  // Obtener configuración de combo de un producto
  async getComboConfig(productId) {
    const productConfig = await this.getProductConfig(productId);
    
    if (!productConfig || !productConfig.is_combo) {
      return null;
    }
    
    return productConfig.combo_config || null;
  }

  // Obtener etiquetas de un producto
  async getProductLabels(productId) {
    const productConfig = await this.getProductConfig(productId);
    return productConfig?.labels || [];
  }

  // Obtener todas las etiquetas disponibles
  async getAllLabels() {
    const config = await this.getConfig();
    return config.labels || [];
  }

  // Limpiar cache
  clearCache() {
    this.cache = {
      config: null,
      lastFetch: null,
      cacheTime: 5 * 60 * 1000
    };
  }

  // Método helper para formatear la configuración de combo
  formatComboConfig(comboConfig) {
    if (!comboConfig) return null;
    
    // Convertir el objeto a un array más fácil de manejar
    const formattedConfig = [];
    
    for (const [categoryId, config] of Object.entries(comboConfig)) {
      formattedConfig.push({
        categoryId: categoryId,
        name: config.name || 'Categoría',
        minSelection: config.minSelection || 1,
        maxSelection: config.maxSelection || 1
      });
    }
    
    return formattedConfig;
  }

  // Validar selecciones de combo
  validateComboSelections(comboConfig, selections) {
    const errors = [];
    
    for (const [categoryId, config] of Object.entries(comboConfig)) {
      const categorySelections = selections[categoryId] || [];
      
      if (categorySelections.length < config.minSelection) {
        errors.push({
          categoryId,
          message: `Debes seleccionar al menos ${config.minSelection} opción(es) en ${config.name}`
        });
      }
      
      if (categorySelections.length > config.maxSelection) {
        errors.push({
          categoryId,
          message: `No puedes seleccionar más de ${config.maxSelection} opción(es) en ${config.name}`
        });
      }
    }
    
    return errors;
  }
}

// Exportar una instancia única
export default new EscandalososAPI();