// src/services/woocommerceApi.js
import { getApiUrl, getAuthHeaders } from '../config/woocommerce';

class WooCommerceAPI {
  constructor() {
    // Cache para configuraciones
    this.cache = {
      shippingZones: null,
      paymentGateways: null,
      storeSettings: null,
      shippingMethods: null
    };
  }

  // Método genérico para hacer peticiones
  async request(endpoint, method = 'GET', data = null) {
    try {
      const url = getApiUrl(endpoint);
      const options = {
        method,
        headers: getAuthHeaders(),
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      console.log('Request URL:', url);
      console.log('Request options:', options);

      const response = await fetch(url, options);
      
      // Intentar obtener el cuerpo de la respuesta
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }

      if (!response.ok) {
        console.error('Error response:', responseData);
        throw new Error(`Error ${response.status}: ${responseData.message || responseData.code || response.statusText}`);
      }

      return responseData;
    } catch (error) {
      console.error('Error en la petición a WooCommerce:', error);
      throw error;
    }
  }

  // === PRODUCTOS ===
  
  // Obtener todos los productos
  async getProducts(params = {}) {
    const queryParams = new URLSearchParams({
      per_page: 100,
      ...params
    }).toString();
    
    const products = await this.request(`products?${queryParams}`);
    
    // Para productos variables, cargar las variaciones y calcular el rango de precios
    const productsWithPriceRange = await Promise.all(
      products.map(async (product) => {
        if (product.type === 'variable' && product.variations && product.variations.length > 0) {
          try {
            // Obtener las variaciones del producto
            const variations = await this.getProductVariations(product.id);
            
            if (variations && variations.length > 0) {
              // Calcular precio mínimo y máximo
              const prices = variations.map(v => parseFloat(v.price)).filter(p => !isNaN(p));
              
              if (prices.length > 0) {
                product.price_range = {
                  min_price: Math.min(...prices),
                  max_price: Math.max(...prices)
                };
                
                // También actualizar el precio base al máximo para mostrar el precio familiar
                product.display_price = Math.max(...prices);
              }
            }
          } catch (error) {
            console.error(`Error obteniendo variaciones para producto ${product.id}:`, error);
          }
        }
        
        return product;
      })
    );
    
    return productsWithPriceRange;
  }

  // Obtener un producto por ID
  async getProduct(id) {
    return this.request(`products/${id}`);
  }

  // Obtener variaciones de un producto
  async getProductVariations(productId) {
    return this.request(`products/${productId}/variations?per_page=100`);
  }

  // Obtener atributos de productos
  async getProductAttributes() {
    return this.request('products/attributes');
  }

  // Obtener términos de un atributo
  async getAttributeTerms(attributeId) {
    return this.request(`products/attributes/${attributeId}/terms`);
  }

  // Obtener categorías de productos
  async getCategories() {
    return this.request('products/categories?per_page=100');
  }

  // === CONFIGURACIONES DE LA TIENDA ===

  // Obtener información de la tienda
  async getStoreInfo() {
    if (this.cache.storeSettings) {
      return this.cache.storeSettings;
    }

    try {
      // Intentar obtener configuraciones generales
      const settings = await this.request('settings/general');
      
      const storeInfo = {
        name: settings.find(s => s.id === 'blogname')?.value || 'Escandalosos Pizza',
        description: settings.find(s => s.id === 'blogdescription')?.value || 'Dark kitchen Isla de Maipo',
        address: settings.find(s => s.id === 'woocommerce_store_address')?.value || 'Camino las parcelas 12',
        address2: settings.find(s => s.id === 'woocommerce_store_address_2')?.value || '',
        city: settings.find(s => s.id === 'woocommerce_store_city')?.value || 'Isla de Maipo',
        postcode: settings.find(s => s.id === 'woocommerce_store_postcode')?.value || '',
        country: settings.find(s => s.id === 'woocommerce_default_country')?.value || 'CL',
        phone: '+56 942740261',
        email: 'hola@escandalosospizza.cl',
        currency: settings.find(s => s.id === 'woocommerce_currency')?.value || 'CLP',
        // Horarios
        schedule: {
          monday_thursday: { open: '18:00', close: '22:00', label: 'Lunes a jueves' },
          friday: { open: '18:00', close: '23:00', label: 'Viernes' },
          saturday: { open: '13:00', close: '23:00', label: 'Sábado' },
          sunday: { open: '13:00', close: '22:00', label: 'Domingo' }
        },
        // Tiempos de entrega
        deliveryTime: '30-45 minutos',
        pickupTime: '20-30 minutos'
      };
      
      this.cache.storeSettings = storeInfo;
      return storeInfo;
    } catch (error) {
      console.error('Error obteniendo información de la tienda:', error);
      // Devolver valores por defecto
      return this.getDefaultStoreInfo();
    }
  }

  // === ENVÍO ===

  // Obtener zonas y métodos de envío
  async getShippingMethods() {
    if (this.cache.shippingMethods) {
      return this.cache.shippingMethods;
    }

    try {
      const zones = await this.request('shipping/zones');
      
      // Para cada zona, obtener sus métodos
      const shippingData = await Promise.all(
        zones.map(async (zone) => {
          try {
            const methods = await this.request(`shipping/zones/${zone.id}/methods`);
            
            // Filtrar y mapear métodos habilitados
            const enabledMethods = methods
              .filter(m => m.enabled)
              .map(method => ({
                id: method.id,
                instanceId: method.instance_id,
                title: method.title,
                methodId: method.method_id,
                methodTitle: method.method_title,
                cost: method.settings?.cost?.value || '0',
                minAmount: method.settings?.min_amount?.value || '0',
                enabled: method.enabled,
                requiresAddress: method.method_id !== 'local_pickup'
              }));
            
            return {
              id: zone.id,
              name: zone.name,
              methods: enabledMethods
            };
          } catch (error) {
            console.error(`Error obteniendo métodos para zona ${zone.id}:`, error);
            return { ...zone, methods: [] };
          }
        })
      );
      
      // Filtrar las zonas que no tienen métodos de envío habilitados
      const zonesWithMethods = shippingData.filter(zone => zone.methods && zone.methods.length > 0);
      
      this.cache.shippingMethods = zonesWithMethods;
      return zonesWithMethods;
    } catch (error) {
      console.error('Error obteniendo métodos de envío:', error);
      return this.getDefaultShippingMethods();
    }
  }

  // Calcular costo de envío
  calculateShippingCost(zones, subtotal, zoneId = null) {
    // Si no hay zonas, devolver 0
    if (!zones || zones.length === 0) return 0;
    
    // Buscar la zona apropiada (por defecto la primera)
    const zone = zoneId ? zones.find(z => z.id === zoneId) : zones[0];
    
    if (!zone || !zone.methods || zone.methods.length === 0) return 0;
    
    // Buscar método de envío (flat_rate o local_delivery)
    const shippingMethod = zone.methods.find(m => 
      m.methodId === 'flat_rate' || 
      m.methodId === 'local_delivery'
    );
    
    if (!shippingMethod) return 0;
    
    const cost = parseFloat(shippingMethod.cost) || 0;
    const minAmount = parseFloat(shippingMethod.minAmount) || 0;
    
    // Si hay monto mínimo para envío gratis y se cumple
    if (minAmount > 0 && subtotal >= minAmount) {
      return 0;
    }
    
    return cost;
  }

  // === MÉTODOS DE PAGO ===

  // Obtener métodos de pago disponibles
  async getPaymentGateways() {
    if (this.cache.paymentGateways) {
      return this.cache.paymentGateways;
    }

    try {
      const gateways = await this.request('payment_gateways');
      
      // Mapear métodos de pago habilitados
      const paymentMethods = gateways
        .filter(gateway => gateway.enabled === true)
        .map(gateway => ({
          id: gateway.id,
          title: gateway.title,
          description: gateway.description,
          icon: this.getPaymentIcon(gateway.id),
          order: gateway.order || 0,
          settings: gateway.settings
        }))
        .sort((a, b) => a.order - b.order);
      
      this.cache.paymentGateways = paymentMethods;
      return paymentMethods;
    } catch (error) {
      console.error('Error obteniendo métodos de pago:', error);
      return this.getDefaultPaymentMethods();
    }
  }

  // Obtener icono para método de pago
  getPaymentIcon(methodId) {
    const icons = {
      'cod': 'DollarSign',           // Contra entrega
      'bacs': 'Building',            // Transferencia bancaria
      'cheque': 'FileText',          // Cheque
      'paypal': 'CreditCard',        // PayPal
      'stripe': 'CreditCard',        // Stripe
      'mercadopago': 'CreditCard',   // MercadoPago
      'webpay': 'CreditCard',        // Webpay
      'transbank': 'CreditCard',     // Transbank
      'flow': 'CreditCard'           // Flow
    };
    
    return icons[methodId] || 'CreditCard';
  }

  // === PEDIDOS ===
  
  // Crear un nuevo pedido
  async createOrder(orderData) {
    const order = {
      payment_method: orderData.paymentMethod || 'cod',
      payment_method_title: orderData.paymentMethodTitle || 'Pago contra entrega',
      set_paid: false,
      status: 'pending',
      customer_note: orderData.notes || '',
      billing: {
        first_name: orderData.customerName,
        last_name: '',
        address_1: orderData.address || '',
        address_2: orderData.reference || '',
        city: orderData.neighborhood || orderData.city || 'Santiago',
        state: '',
        postcode: '',
        country: 'CL',
        email: orderData.email || '',
        phone: orderData.phone || ''
      },
      shipping: {
        first_name: orderData.customerName,
        last_name: '',
        address_1: orderData.address || '',
        address_2: orderData.reference || '',
        city: orderData.neighborhood || orderData.city || 'Santiago',
        state: '',
        postcode: '',
        country: 'CL'
      },
      line_items: orderData.items.map(item => {
        const lineItem = {
          product_id: parseInt(item.productId),
          quantity: parseInt(item.quantity)
        };

        // Si tiene variación, agregar variation_id
        if (item.variationId) {
          lineItem.variation_id = parseInt(item.variationId);
        }

        // IMPORTANTE: Si el item tiene un precio personalizado (con addons), usar ese precio
        if (item.price) {
          // Opción 1: Enviar precio total (producto + addons)
          lineItem.total = (parseFloat(item.price) * parseInt(item.quantity)).toString();
          lineItem.subtotal = lineItem.total;
          
          // Opción 2 (comentada): Si quieres desglosar, envía solo el precio base
          // y deja que Advanced Product Fields maneje los addons
          /*
          // Calcular precio base sin addons
          const basePrice = parseFloat(item.price) - (item.customizations?.addonsPrice || 0);
          lineItem.total = (basePrice * parseInt(item.quantity)).toString();
          lineItem.subtotal = lineItem.total;
          */
        }

        // Si tiene meta data (personalizaciones)
        if (item.customizations) {
          lineItem.meta_data = [];
          
          // Instrucciones especiales
          if (item.customizations.specialInstructions) {
            lineItem.meta_data.push({
              key: 'instrucciones_especiales',
              value: item.customizations.specialInstructions
            });
          }

          // Campos de Advanced Product Fields
          if (item.customizations.productAddons?.length > 0) {
            item.customizations.productAddons.forEach(addon => {
              lineItem.meta_data.push({
                key: addon.key,
                value: addon.value,
                display_key: addon.display || addon.key,
                display_value: addon.value
              });
            });
          }

          // Si es un combo, agregar información de las selecciones
          if (item.customizations.type === 'combo' && item.customizations.comboSelections) {
            // Agregar cada categoría del combo como meta data
            Object.entries(item.customizations.comboSelections).forEach(([categoryId, selections]) => {
              const categoryInfo = item.customizations.comboConfig?.[categoryId];
              if (categoryInfo && selections.length > 0) {
                // Crear una lista legible de los productos seleccionados
                const selectedNames = selections.map(sel => sel.name).join(', ');
                lineItem.meta_data.push({
                  key: `combo_${categoryInfo.name || categoryId}`,
                  value: selectedNames,
                  display_key: categoryInfo.name || `Categoría ${categoryId}`,
                  display_value: selectedNames
                });
              }
            });
            
            // Agregar un indicador de que es un combo
            lineItem.meta_data.push({
              key: '_is_combo',
              value: 'true'
            });
          }
        }

        return lineItem;
      }),
      shipping_lines: [],
      fee_lines: [],
      meta_data: []
    };

    // Agregar línea de envío si es delivery
    if (orderData.orderType === 'delivery' && orderData.shippingMethod) {
      order.shipping_lines.push({
        method_id: orderData.shippingMethod.methodId || 'flat_rate',
        method_title: orderData.shippingMethod.title || 'Envío a domicilio',
        total: orderData.shippingMethod.cost?.toString() || '0'
      });
    }

    // Agregar meta data adicional
    order.meta_data.push({
      key: '_order_type',
      value: orderData.orderType || 'delivery'
    });

    if (orderData.paymentMethod === 'cod' && orderData.cashAmount) {
      order.meta_data.push({
        key: '_cash_amount',
        value: orderData.cashAmount
      });
    }

    return this.request('orders', 'POST', order);
  }

  // Obtener un pedido
  async getOrder(orderId) {
    return this.request(`orders/${orderId}`);
  }

  // Actualizar estado de un pedido
  async updateOrderStatus(orderId, status) {
    return this.request(`orders/${orderId}`, 'PUT', { status });
  }

  // === CLIENTES ===
  
  // Crear cliente
  async createCustomer(customerData) {
    return this.request('customers', 'POST', customerData);
  }

  // Obtener cliente
  async getCustomer(customerId) {
    return this.request(`customers/${customerId}`);
  }

  // === MÉTODOS DE UTILIDAD ===

  // Limpiar cache
  clearCache() {
    this.cache = {
      shippingZones: null,
      paymentGateways: null,
      storeSettings: null,
      shippingMethods: null
    };
  }

  // === ZONAS DE ENVÍO ===
  
  // Obtener zonas de envío disponibles para delivery
  async getDeliveryZones() {
    try {
      // Intentar obtener desde un endpoint personalizado o configuración
      const response = await fetch(
        'https://escandalosospizzas.cl/wp/wp-json/wp/v2/settings/delivery_zones',
        { headers: getAuthHeaders() }
      );
      
      if (response.ok) {
        const zones = await response.json();
        return zones;
      }
    } catch (error) {
      console.error('Error obteniendo zonas de delivery:', error);
    }
    
    // Si no hay configuración, devolver array vacío
    // Las zonas deberían configurarse en WooCommerce
    return [];
  }

  // === VALORES POR DEFECTO ===
  // Estos valores solo se usan si la API falla completamente

  getDefaultStoreInfo() {
    console.warn('Usando información de tienda por defecto. Configure en WooCommerce.');
    return {
      name: 'Escandalosos Pizza',
      description: 'Dark kitchen Isla de Maipo',
      address: 'Camino las parcelas 12',
      address2: '',
      city: 'Isla de Maipo',
      postcode: '',
      country: 'CL',
      phone: '+56 942740261',
      email: 'hola@escandalosospizza.cl',
      currency: 'CLP',
      schedule: {
        monday_thursday: { open: '18:00', close: '22:00', label: 'Lunes a jueves' },
        friday: { open: '18:00', close: '23:00', label: 'Viernes' },
        saturday: { open: '13:00', close: '23:00', label: 'Sábado' },
        sunday: { open: '13:00', close: '22:00', label: 'Domingo' }
      },
      deliveryTime: '30-45 minutos',
      pickupTime: '20-30 minutos'
    };
  }

  getDefaultShippingMethods() {
    console.warn('No se encontraron métodos de envío configurados en WooCommerce.');
    // Devolver array vacío - los métodos deben configurarse en WooCommerce
    return [];
  }

  getDefaultPaymentMethods() {
    console.warn('No se encontraron métodos de pago configurados en WooCommerce.');
    // Devolver array vacío - los métodos deben configurarse en WooCommerce
    return [];
  }
}

export default new WooCommerceAPI();