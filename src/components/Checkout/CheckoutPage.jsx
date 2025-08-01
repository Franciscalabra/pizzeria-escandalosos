import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Home,
  MessageSquare,
  DollarSign,
  CreditCard,
  Check,
  Truck,
  Store,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Loader
} from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import woocommerceApi from '../../services/woocommerceApi';
import './CheckoutPage.css';

// Agregar estilos en línea para el spinner si no están en el CSS
const spinnerStyle = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .spinner {
    animation: spin 1s linear infinite;
  }
`;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart, getItemCount } = useContext(CartContext);
  
  // Función para formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };
  
  // Estados principales
  const [currentStep, setCurrentStep] = useState(1);
  const [orderType, setOrderType] = useState('delivery');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [showOrderSummary, setShowOrderSummary] = useState(true);
  
  // Estados para datos de WooCommerce
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  
  // Estados del formulario con localStorage
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('checkoutFormData');
    return savedData ? JSON.parse(savedData) : {
      customerName: '',
      email: '',
      phone: '',
      address: '',
      neighborhood: '',
      reference: '',
      notes: '',
      paymentMethod: '',
      cashAmount: ''
    };
  });
  
  // Estados para validación y autocompletado
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [savedAddresses] = useState(() => {
    const saved = localStorage.getItem('savedAddresses');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  // Cargar datos de WooCommerce al montar el componente
  useEffect(() => {
    const loadWooCommerceData = async () => {
      setInitialLoading(true);
      try {
        // Cargar métodos de envío, métodos de pago e información de la tienda
        const [shippingData, paymentData, storeData] = await Promise.all([
          woocommerceApi.getShippingMethods(),
          woocommerceApi.getPaymentGateways(),
          woocommerceApi.getStoreInfo()
        ]);
        
        setShippingMethods(shippingData);
        setPaymentMethods(paymentData);
        setStoreInfo(storeData);
        
        // Establecer el primer método de pago disponible como predeterminado
        if (paymentData.length > 0 && !formData.paymentMethod) {
          setFormData(prev => ({ ...prev, paymentMethod: paymentData[0].id }));
        }
        
        // Calcular el costo de envío inicial
        if (shippingData.length > 0) {
          const defaultZone = shippingData[0];
          const shippingMethod = defaultZone.methods.find(m => 
            m.methodId === 'flat_rate' || m.methodId === 'local_delivery'
          );
          
          if (shippingMethod) {
            setSelectedShippingMethod(shippingMethod);
            const cost = woocommerceApi.calculateShippingCost(
              shippingData, 
              getCartTotal()
            );
            setDeliveryFee(cost);
          }
        }
      } catch (error) {
        console.error('Error cargando datos de WooCommerce:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadWooCommerceData();
  }, []);

  // Actualizar costo de envío cuando cambie el subtotal o el tipo de pedido
  useEffect(() => {
    if (orderType === 'delivery' && shippingMethods.length > 0) {
      const cost = woocommerceApi.calculateShippingCost(
        shippingMethods, 
        getCartTotal()
      );
      setDeliveryFee(cost);
    }
  }, [orderType, shippingMethods, getCartTotal]);

  // Guardar progreso en localStorage
  useEffect(() => {
    if (!orderSuccess) {
      localStorage.setItem('checkoutFormData', JSON.stringify(formData));
    }
  }, [formData, orderSuccess]);

  // Limpiar localStorage al completar pedido
  useEffect(() => {
    if (orderSuccess) {
      localStorage.removeItem('checkoutFormData');
    }
  }, [orderSuccess]);

  // Redirigir si no hay items en el carrito
  useEffect(() => {
    if (cart.length === 0 && !orderSuccess) {
      navigate('/menu');
    }
  }, [cart, navigate, orderSuccess]);

  // Validación en tiempo real
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'customerName':
        if (!value.trim()) error = 'El nombre es requerido';
        else if (value.trim().length < 3) error = 'El nombre debe tener al menos 3 caracteres';
        break;
      
      case 'phone':
        const phoneRegex = /^(\+56)?[9][0-9]{8}$/;
        if (!value) error = 'El teléfono es requerido';
        else if (!phoneRegex.test(value.replace(/\s/g, ''))) error = 'Formato inválido (ej: +56912345678)';
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) error = 'El email es requerido';
        else if (!emailRegex.test(value)) error = 'Email inválido';
        break;
      
      case 'address':
        if (orderType === 'delivery' && !value.trim()) error = 'La dirección es requerida';
        break;
      
      case 'neighborhood':
        if (orderType === 'delivery' && !value.trim()) error = 'La comuna es requerida';
        break;
      
      case 'cashAmount':
        if (formData.paymentMethod === 'cod' && value) {
          const amount = parseFloat(value);
          const total = getCartTotal() + (orderType === 'delivery' ? deliveryFee : 0);
          if (amount < total) error = `El monto debe ser mayor a ${formatPrice(total)}`;
        }
        break;
      
      default:
        break;
    }
    
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validación en tiempo real solo si el campo fue tocado
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateStep = (step) => {
    let stepErrors = {};
    
    switch (step) {
      case 1:
        stepErrors.customerName = validateField('customerName', formData.customerName);
        stepErrors.phone = validateField('phone', formData.phone);
        stepErrors.email = validateField('email', formData.email);
        break;
      
      case 2:
        if (orderType === 'delivery') {
          stepErrors.address = validateField('address', formData.address);
          stepErrors.neighborhood = validateField('neighborhood', formData.neighborhood);
        }
        break;
      
      case 3:
        if (formData.paymentMethod === 'cod' && formData.cashAmount) {
          stepErrors.cashAmount = validateField('cashAmount', formData.cashAmount);
        }
        if (!formData.paymentMethod) {
          stepErrors.paymentMethod = 'Debes seleccionar un método de pago';
        }
        break;
      
      default:
        break;
    }
    
    // Filtrar errores vacíos
    const filteredErrors = Object.entries(stepErrors).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {});
    
    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      window.scrollTo(0, 0);
    } else {
      // Marcar todos los campos del paso actual como tocados
      const fieldsToTouch = currentStep === 1 
        ? ['customerName', 'phone', 'email']
        : currentStep === 2 && orderType === 'delivery'
        ? ['address', 'neighborhood']
        : [];
      
      const newTouched = fieldsToTouch.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {});
      
      setTouched(prev => ({ ...prev, ...newTouched }));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const selectSavedAddress = (address) => {
    setFormData(prev => ({
      ...prev,
      address: address.address,
      neighborhood: address.neighborhood,
      reference: address.reference || ''
    }));
    setShowAddressSuggestions(false);
  };

  const handleSubmitOrder = async () => {
    if (!validateStep(3)) return;
    
    setLoading(true);
    
    try {
      // Encontrar el método de pago seleccionado
      const selectedPaymentMethod = paymentMethods.find(m => m.id === formData.paymentMethod);
      
      const orderData = {
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        orderType,
        items: cart.map(item => ({
          productId: item.productId,
          variationId: item.variationId,
          quantity: item.quantity,
          customizations: item.customizations
        })),
        address: orderType === 'delivery' ? formData.address : null,
        neighborhood: orderType === 'delivery' ? formData.neighborhood : null,
        reference: orderType === 'delivery' ? formData.reference : null,
        paymentMethod: formData.paymentMethod,
        paymentMethodTitle: selectedPaymentMethod?.title || formData.paymentMethod,
        cashAmount: formData.paymentMethod === 'cod' ? formData.cashAmount : null,
        shippingMethod: orderType === 'delivery' ? selectedShippingMethod : null,
        notes: formData.notes
      };

      const order = await woocommerceApi.createOrder(orderData);
      
      setOrderId(order.id);
      setOrderSuccess(true);
      clearCart();
      
      // Guardar dirección si es nueva
      if (orderType === 'delivery' && formData.address) {
        const newAddress = {
          address: formData.address,
          neighborhood: formData.neighborhood,
          reference: formData.reference
        };
        
        const existingAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
        const isDuplicate = existingAddresses.some(addr => 
          addr.address === newAddress.address && 
          addr.neighborhood === newAddress.neighborhood
        );
        
        if (!isDuplicate) {
          existingAddresses.push(newAddress);
          localStorage.setItem('savedAddresses', JSON.stringify(existingAddresses));
        }
      }
      
    } catch (error) {
      console.error('Error al crear pedido:', error);
      alert('Error al procesar el pedido. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el ícono del método de pago
  const getPaymentIcon = (methodId) => {
    const icons = {
      'cod': DollarSign,
      'bacs': DollarSign,
      'cheque': DollarSign,
      'paypal': CreditCard,
      'stripe': CreditCard,
      'mercadopago': CreditCard,
      'webpay': CreditCard,
      'transbank': CreditCard,
      'flow': CreditCard
    };
    
    return icons[methodId] || CreditCard;
  };

  const subtotal = getCartTotal();
  const total = subtotal + (orderType === 'delivery' ? deliveryFee : 0);

  if (initialLoading) {
    return (
      <div className="checkout-page">
        <style>{spinnerStyle}</style>
        <div className="checkout-loading" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '1rem'
        }}>
          <Loader className="spinner" size={48} />
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="checkout-success-container">
          <div className="checkout-success-icon">
            <Check size={48} />
          </div>
          <h1 className="checkout-success-title">¡Gracias por tu pedido!</h1>
          <p className="checkout-success-order">Pedido #{orderId}</p>
          <p className="checkout-success-message">
            {orderType === 'delivery' 
              ? `Tu pedido será entregado en ${storeInfo?.deliveryTime || '30-45 minutos'}`
            : `Te avisaremos cuando tu pedido esté listo para retiro`
}
          </p>
          <div className="checkout-success-details">
            <p>Te hemos enviado un email con los detalles de tu pedido.</p>
            <p>También recibirás un WhatsApp con la confirmación.</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/')}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Header */}
        <div className="checkout-header">
          <button 
            className="checkout-back-btn"
            onClick={() => currentStep > 1 ? handlePrevStep() : navigate('/cart')}
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>
          <h1 className="checkout-title">Finalizar Pedido</h1>
        </div>

        {/* Progress Bar */}
        <div className="checkout-progress">
          <div className="checkout-progress-bar">
            <div 
              className="checkout-progress-fill"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
          <div className="checkout-steps">
            {['Datos', orderType === 'delivery' ? 'Dirección' : 'Retiro', 'Pago'].map((step, index) => (
              <div 
                key={step}
                className={`checkout-step ${currentStep > index + 1 ? 'completed' : ''} ${currentStep === index + 1 ? 'active' : ''}`}
              >
                <div className="checkout-step-circle">
                  {currentStep > index + 1 ? <Check size={16} /> : index + 1}
                </div>
                <span className="checkout-step-label">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="checkout-main">
          {/* Main Content */}
          <div className="checkout-content">
            {/* Step 1: Información Personal */}
            {currentStep === 1 && (
              <div className="checkout-form-section">
                {/* Tipo de pedido */}
                <div className="checkout-order-type">
                  <h2 className="checkout-section-title">¿Cómo quieres recibir tu pedido?</h2>
                  <div className="checkout-order-options">
                    <button
                      onClick={() => setOrderType('delivery')}
                      className={`checkout-order-option ${orderType === 'delivery' ? 'active' : ''}`}
                    >
                      <Truck size={32} />
                      <h3>Delivery</h3>
                      <p>Recibe en tu domicilio</p>
                      <span className="checkout-order-price">
                        {deliveryFee > 0 ? `por ${formatPrice(deliveryFee)}` : 'Calculando...'}
                      </span>
                    </button>

                    <button
                      onClick={() => setOrderType('pickup')}
                      className={`checkout-order-option ${orderType === 'pickup' ? 'active' : ''}`}
                    >
                      <Store size={32} />
                      <h3>Retiro en Tienda</h3>
                      <p>Retira tu pedido</p>
                      <span className="checkout-order-price checkout-order-free">Sin costo</span>
                    </button>
                  </div>
                </div>

                <h2 className="checkout-section-title">Información Personal</h2>
                
                <div className="checkout-form-group">
                  <label className="checkout-form-label">
                    <User size={18} />
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`checkout-form-input ${errors.customerName && touched.customerName ? 'error' : ''}`}
                    placeholder="Juan Pérez"
                  />
                  {errors.customerName && touched.customerName && (
                    <span className="checkout-form-error">{errors.customerName}</span>
                  )}
                </div>

                <div className="checkout-form-group">
                  <label className="checkout-form-label">
                    <Phone size={18} />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`checkout-form-input ${errors.phone && touched.phone ? 'error' : ''}`}
                    placeholder="+56912345678"
                  />
                  {errors.phone && touched.phone && (
                    <span className="checkout-form-error">{errors.phone}</span>
                  )}
                  <span className="checkout-form-hint">Te contactaremos por WhatsApp</span>
                </div>

                <div className="checkout-form-group">
                  <label className="checkout-form-label">
                    <Mail size={18} />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`checkout-form-input ${errors.email && touched.email ? 'error' : ''}`}
                    placeholder="juan@ejemplo.com"
                  />
                  {errors.email && touched.email && (
                    <span className="checkout-form-error">{errors.email}</span>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Dirección o Información de Retiro */}
            {currentStep === 2 && (
              <div className="checkout-form-section">
                <h2 className="checkout-section-title">
                  {orderType === 'delivery' ? 'Dirección de Entrega' : 'Información de Retiro'}
                </h2>
                
                {orderType === 'delivery' ? (
                  <>
                    <div className="checkout-form-group">
                      <label className="checkout-form-label">
                        <MapPin size={18} />
                        Dirección completa
                      </label>
                      <div className="checkout-input-wrapper">
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          onFocus={() => setShowAddressSuggestions(true)}
                          className={`checkout-form-input ${errors.address && touched.address ? 'error' : ''}`}
                          placeholder="Av. Principal 123, Depto 45"
                        />
                        
                        {showAddressSuggestions && savedAddresses.length > 0 && (
                          <div className="checkout-address-suggestions">
                            <div className="suggestions-header">
                              <span>Direcciones guardadas</span>
                              <button onClick={() => setShowAddressSuggestions(false)}>
                                <X size={16} />
                              </button>
                            </div>
                            {savedAddresses.map((addr, index) => (
                              <button
                                key={index}
                                className="suggestion-item"
                                onClick={() => selectSavedAddress(addr)}
                              >
                                <MapPin size={16} />
                                <div>
                                  <p>{addr.address}</p>
                                  <span>{addr.neighborhood}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {errors.address && touched.address && (
                        <span className="checkout-form-error">{errors.address}</span>
                      )}
                    </div>

                    <div className="checkout-form-group">
                      <label className="checkout-form-label">
                        <Home size={18} />
                        Comuna
                      </label>
                      <input
                        type="text"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`checkout-form-input ${errors.neighborhood && touched.neighborhood ? 'error' : ''}`}
                        placeholder="Providencia"
                      />
                      {errors.neighborhood && touched.neighborhood && (
                        <span className="checkout-form-error">{errors.neighborhood}</span>
                      )}
                    </div>

                    <div className="checkout-form-group">
                      <label className="checkout-form-label">
                        <MessageSquare size={18} />
                        Referencias (opcional)
                      </label>
                      <input
                        type="text"
                        name="reference"
                        value={formData.reference}
                        onChange={handleInputChange}
                        className="checkout-form-input"
                        placeholder="Entre calle A y B, casa azul"
                      />
                      <span className="checkout-form-hint">Ayuda al repartidor a encontrarte</span>
                    </div>
                  </>
                ) : (
                  <div className="checkout-pickup-info">
                    <Clock size={48} className="checkout-pickup-icon" />
                    <h3>Tu pedido estará listo en {storeInfo?.pickupTime || '20-30 minutos'}</h3>
                    <div className="checkout-pickup-details">
                      <p><strong>Dirección:</strong> {storeInfo?.address ? 
                        `${storeInfo.address}, ${storeInfo.city}` : 
                        'Cargando dirección...'
                      }</p>
                      <p><strong>Horario:</strong> {storeInfo?.schedule ? 
                        Object.entries(storeInfo.schedule).map(([key, value]) => (
                          <span key={key}>
                            {value.label}: {value.open} - {value.close}<br />
                          </span>
                        )) : 
                        'Cargando horarios...'
                      }</p>
                      <p><strong>Teléfono:</strong> {storeInfo?.phone || 'Cargando...'}</p>
                    </div>
                    <div className="checkout-pickup-note">
                      <AlertCircle size={16} />
                      <p>Te enviaremos un WhatsApp cuando tu pedido esté listo</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Pago */}
            {currentStep === 3 && (
              <div className="checkout-form-section">
                <h2 className="checkout-section-title">Método de Pago</h2>
                
                <div className="checkout-payment-options">
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((method) => {
                      const IconComponent = getPaymentIcon(method.id);
                      const isDisabled = false; // Todos los métodos habilitados desde WooCommerce están disponibles
                      
                      return (
                        <label 
                          key={method.id} 
                          className={`checkout-payment-option ${isDisabled ? 'disabled' : ''}`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={formData.paymentMethod === method.id}
                            onChange={handleInputChange}
                            disabled={isDisabled}
                          />
                          <div className="checkout-payment-content">
                            <IconComponent size={24} />
                            <div>
                              <h3>{method.title}</h3>
                              <p>{method.description || 'Método de pago disponible'}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="checkout-no-payment-methods">
                      <AlertCircle size={32} />
                      <p>No hay métodos de pago disponibles</p>
                    </div>
                  )}

                  {formData.paymentMethod === 'cod' && (
                    <div className="checkout-cash-amount">
                      <label className="checkout-form-label">
                        ¿Con cuánto pagarás? (opcional)
                      </label>
                      <input
                        type="number"
                        name="cashAmount"
                        value={formData.cashAmount}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`checkout-form-input ${errors.cashAmount ? 'error' : ''}`}
                        placeholder={formatPrice(Math.ceil(total / 1000) * 1000)}
                        min={total}
                      />
                      {errors.cashAmount && (
                        <span className="checkout-form-error">{errors.cashAmount}</span>
                      )}
                      <span className="checkout-form-hint">
                        Para preparar tu vuelto
                      </span>
                    </div>
                  )}
                </div>

                {errors.paymentMethod && (
                  <span className="checkout-form-error">{errors.paymentMethod}</span>
                )}

                <div className="checkout-form-group">
                  <label className="checkout-form-label">
                    <MessageSquare size={18} />
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="checkout-form-input checkout-textarea"
                    placeholder="Ej: Sin cebolla, extra picante, etc."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-sidebar">
            <div className="checkout-order-summary">
              <button 
                className="checkout-summary-toggle"
                onClick={() => setShowOrderSummary(!showOrderSummary)}
              >
                <h3>Resumen del Pedido</h3>
                {showOrderSummary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {showOrderSummary && (
                <div className="checkout-summary-content">
                  <div className="checkout-summary-items">
                    {cart.map(item => (
                      <div key={item.id} className="checkout-summary-item">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="checkout-summary-totals">
                    <div className="checkout-summary-row">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {orderType === 'delivery' && (
                      <div className="checkout-summary-row">
                        <span>Delivery</span>
                        <span>{deliveryFee > 0 ? formatPrice(deliveryFee) : 'Envío gratis'}</span>
                      </div>
                    )}
                    <div className="checkout-summary-row checkout-summary-total">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="checkout-actions">
              {currentStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="btn btn-primary checkout-continue-btn"
                >
                  Continuar
                </button>
              ) : (
                <button
                  onClick={handleSubmitOrder}
                  disabled={loading || !formData.paymentMethod}
                  className="btn btn-primary checkout-confirm-btn"
                >
                  {loading ? 'Procesando...' : 'Confirmar Pedido'}
                </button>
              )}
              
              <button
                onClick={() => navigate('/cart')}
                className="btn btn-secondary"
              >
                Volver al carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;