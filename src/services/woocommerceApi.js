// src/services/woocommerceApi.js
import { getApiUrl, getAuthHeaders } from '../config/woocommerce';

class WooCommerceAPI {
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
    
    return this.request(`products?${queryParams}`);
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

  // === PEDIDOS ===
  
  // Crear un nuevo pedido
  async createOrder(orderData) {
    const order = {
      payment_method: orderData.paymentMethod || 'cash',
      payment_method_title: orderData.paymentMethodTitle || 'Pago en efectivo',
      set_paid: false,
      status: 'pending',
      billing: {
        first_name: orderData.customerName,
        last_name: '',
        address_1: orderData.address || '',
        city: orderData.city || 'Santiago',
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
        city: orderData.city || 'Santiago',
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

        // Si tiene meta data (personalizaciones)
        if (item.customizations) {
          lineItem.meta_data = [];
          
          if (item.customizations.extraIngredients?.length > 0) {
            lineItem.meta_data.push({
              key: 'ingredientes_extra',
              value: item.customizations.extraIngredients.map(i => i.name).join(', ')
            });
          }

          if (item.customizations.removedIngredients?.length > 0) {
            lineItem.meta_data.push({
              key: 'ingredientes_removidos',
              value: item.customizations.removedIngredients.join(', ')
            });
          }

          if (item.customizations.specialInstructions) {
            lineItem.meta_data.push({
              key: 'instrucciones_especiales',
              value: item.customizations.specialInstructions
            });
          }

          // Agregar campos de Advanced Product Fields
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
        }

        return lineItem;
      }),
      shipping_lines: orderData.shipping ? [{
        method_id: orderData.shipping.method_id || 'flat_rate',
        method_title: orderData.shipping.method_title || 'Envío a domicilio',
        total: orderData.shipping.cost?.toString() || '0'
      }] : []
    };

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
}

export default new WooCommerceAPI();