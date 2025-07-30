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
      line_items: orderData.items.map(item => ({
        product_id: parseInt(item.productId), // Asegurarse de que sea un número
        quantity: parseInt(item.quantity)
      })),
      shipping_lines: orderData.shipping ? [{
        method_id: 'flat_rate',
        method_title: 'Delivery',
        total: orderData.shipping.toString()
      }] : [],
      customer_note: orderData.notes || ''
    };

    console.log('Order payload:', JSON.stringify(order, null, 2));

    return this.request('orders', 'POST', order);
  }

  // Obtener pedidos
  async getOrders(params = {}) {
    const queryParams = new URLSearchParams({
      per_page: 20,
      ...params
    }).toString();
    
    return this.request(`orders?${queryParams}`);
  }

  // Obtener un pedido por ID
  async getOrder(id) {
    return this.request(`orders/${id}`);
  }

  // Actualizar estado del pedido
  async updateOrderStatus(orderId, status) {
    return this.request(`orders/${orderId}`, 'PUT', { status });
  }

  // === CLIENTES ===
  
  // Crear cliente
  async createCustomer(customerData) {
    const customer = {
      email: customerData.email,
      first_name: customerData.firstName,
      last_name: customerData.lastName || '',
      username: customerData.email,
      billing: {
        first_name: customerData.firstName,
        last_name: customerData.lastName || '',
        email: customerData.email,
        phone: customerData.phone || '',
        address_1: customerData.address || '',
        city: customerData.city || 'Santiago',
        country: 'CL'
      }
    };

    return this.request('customers', 'POST', customer);
  }

  // Buscar cliente por email
  async getCustomerByEmail(email) {
    return this.request(`customers?email=${email}`);
  }

  // === MÉTODOS DE PAGO ===
  
  // Obtener métodos de pago disponibles
  async getPaymentMethods() {
    return this.request('payment_gateways');
  }

  // === ZONAS DE ENVÍO ===
  
  // Obtener zonas de envío
  async getShippingZones() {
    return this.request('shipping/zones');
  }

  // === CUPONES ===
  
  // Validar cupón
  async getCoupon(code) {
    return this.request(`coupons?code=${code}`);
  }
}

// Exportar instancia única
export default new WooCommerceAPI();