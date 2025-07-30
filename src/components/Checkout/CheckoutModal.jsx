import React, { useState, useEffect, useContext } from 'react';
import { MapPin, Truck, Store, Clock, CreditCard, DollarSign, Phone, Mail, User, Home, MessageSquare, ChevronRight, Check, AlertCircle, X, ArrowLeft } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import woocommerceApi from '../../services/woocommerceApi';
import './CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose }) => {
  const { cart, getCartTotal, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [shippingZones, setShippingZones] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [orderType, setOrderType] = useState('delivery');
  const [currentStep, setCurrentStep] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    neighborhood: '',
    reference: '',
    notes: '',
    paymentMethod: 'cash',
    cashAmount: ''
  });
  const [deliveryFee, setDeliveryFee] = useState(2500);
  const [selectedZone, setSelectedZone] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadShippingData();
      loadPaymentMethods();
    }
  }, [isOpen]);

  const loadShippingData = async () => {
    try {
      const zones = await woocommerceApi.getShippingZones();
      setShippingZones(zones);
    } catch (error) {
      console.error('Error cargando zonas de envío:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await woocommerceApi.getPaymentMethods();
      setPaymentMethods(methods.filter(m => m.enabled));
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
    }
  };

  useEffect(() => {
    if (orderType === 'delivery' && selectedZone) {
      setDeliveryFee(selectedZone.methods?.[0]?.settings?.cost?.value || 2500);
    } else {
      setDeliveryFee(0);
    }
  }, [orderType, selectedZone]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.customerName) newErrors.customerName = 'Nombre requerido';
      if (!formData.phone) newErrors.phone = 'Teléfono requerido';
      if (!formData.email) newErrors.email = 'Email requerido';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
    }

    if (step === 2 && orderType === 'delivery') {
      if (!formData.address) newErrors.address = 'Dirección requerida';
      if (!formData.neighborhood) newErrors.neighborhood = 'Comuna requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmitOrder = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const orderData = {
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        address: orderType === 'delivery' ? formData.address : 'Retiro en tienda',
        city: formData.neighborhood || 'Santiago',
        paymentMethod: formData.paymentMethod,
        paymentMethodTitle: formData.paymentMethod === 'cash' ? 'Pago en efectivo' : 'Transferencia bancaria',
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        shipping: orderType === 'delivery' ? deliveryFee : null,
        notes: formData.notes
      };

      const order = await woocommerceApi.createOrder(orderData);
      
      setOrderId(order.id);
      setOrderSuccess(true);
      clearCart();
      
      // Cerrar modal después de 5 segundos
      setTimeout(() => {
        handleClose();
      }, 5000);
      
    } catch (error) {
      console.error('Error al crear pedido:', error);
      alert('Error al procesar el pedido. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setOrderSuccess(false);
    setOrderId(null);
    setFormData({
      customerName: '',
      email: '',
      phone: '',
      address: '',
      neighborhood: '',
      reference: '',
      notes: '',
      paymentMethod: 'cash',
      cashAmount: ''
    });
    setErrors({});
    onClose();
  };

  const subtotal = getCartTotal();
  const total = subtotal + deliveryFee;

  if (!isOpen) return null;

  return (
    <div className="checkout-modal-overlay">
      <div className="checkout-modal-container">
        {/* Header */}
        <div className="checkout-modal-header">
          <div className="checkout-modal-header-content">
            {currentStep > 1 && !orderSuccess && (
              <button 
                className="checkout-back-btn"
                onClick={handlePrevStep}
                aria-label="Volver"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="checkout-modal-title">
              {orderSuccess ? '¡Pedido Confirmado!' : 'Finalizar Pedido'}
            </h2>
            <button 
              className="checkout-close-btn"
              onClick={handleClose}
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>
          </div>
          
          {!orderSuccess && (
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
          )}
        </div>

        {/* Content */}
        <div className="checkout-modal-content">
          {orderSuccess ? (
            <div className="checkout-success">
              <div className="checkout-success-icon">
                <Check size={48} />
              </div>
              <h3 className="checkout-success-title">¡Gracias por tu pedido!</h3>
              <p className="checkout-success-order">Pedido #{orderId}</p>
              <p className="checkout-success-message">
                {orderType === 'delivery' 
                  ? 'Tu pedido será entregado en 30-45 minutos'
                  : 'Tu pedido estará listo para retirar en 20-30 minutos'
                }
              </p>
              <div className="checkout-success-details">
                <p>Te hemos enviado un email con los detalles de tu pedido.</p>
                <p>También recibirás un WhatsApp con la confirmación.</p>
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleClose}
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div className="checkout-form-container">
              {/* Tipo de pedido - Siempre visible */}
              {currentStep === 1 && (
                <div className="checkout-order-type">
                  <h3 className="checkout-section-title">¿Cómo quieres recibir tu pedido?</h3>
                  <div className="checkout-order-options">
                    <button
                      onClick={() => setOrderType('delivery')}
                      className={`checkout-order-option ${orderType === 'delivery' ? 'active' : ''}`}
                    >
                      <Truck size={32} />
                      <h4>Delivery</h4>
                      <p>Recibe en tu domicilio</p>
                      <span className="checkout-order-price">Desde {formatPrice(2500)}</span>
                    </button>

                    <button
                      onClick={() => setOrderType('pickup')}
                      className={`checkout-order-option ${orderType === 'pickup' ? 'active' : ''}`}
                    >
                      <Store size={32} />
                      <h4>Retiro en Tienda</h4>
                      <p>Retira tu pedido</p>
                      <span className="checkout-order-price checkout-order-free">Sin costo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Información Personal */}
              {currentStep === 1 && (
                <div className="checkout-form-section">
                  <h3 className="checkout-section-title">Información Personal</h3>
                  
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
                      className={`checkout-form-input ${errors.customerName ? 'error' : ''}`}
                      placeholder="Juan Pérez"
                    />
                    {errors.customerName && (
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
                      className={`checkout-form-input ${errors.phone ? 'error' : ''}`}
                      placeholder="+56 9 1234 5678"
                    />
                    {errors.phone && (
                      <span className="checkout-form-error">{errors.phone}</span>
                    )}
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
                      className={`checkout-form-input ${errors.email ? 'error' : ''}`}
                      placeholder="juan@email.com"
                    />
                    {errors.email && (
                      <span className="checkout-form-error">{errors.email}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Dirección o Retiro */}
              {currentStep === 2 && (
                <div className="checkout-form-section">
                  <h3 className="checkout-section-title">
                    {orderType === 'delivery' ? 'Dirección de Entrega' : 'Información de Retiro'}
                  </h3>
                  
                  {orderType === 'delivery' ? (
                    <>
                      <div className="checkout-form-group">
                        <label className="checkout-form-label">
                          <Home size={18} />
                          Dirección
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className={`checkout-form-input ${errors.address ? 'error' : ''}`}
                          placeholder="Av. Principal 123, Depto 45"
                        />
                        {errors.address && (
                          <span className="checkout-form-error">{errors.address}</span>
                        )}
                      </div>

                      <div className="checkout-form-group">
                        <label className="checkout-form-label">
                          <MapPin size={18} />
                          Comuna
                        </label>
                        <select
                          name="neighborhood"
                          value={formData.neighborhood}
                          onChange={handleInputChange}
                          className={`checkout-form-input ${errors.neighborhood ? 'error' : ''}`}
                        >
                          <option value="">Selecciona tu comuna</option>
                          <option value="Santiago Centro">Santiago Centro</option>
                          <option value="Providencia">Providencia</option>
                          <option value="Las Condes">Las Condes</option>
                          <option value="Ñuñoa">Ñuñoa</option>
                          <option value="La Reina">La Reina</option>
                          <option value="Vitacura">Vitacura</option>
                        </select>
                        {errors.neighborhood && (
                          <span className="checkout-form-error">{errors.neighborhood}</span>
                        )}
                      </div>

                      <div className="checkout-form-group">
                        <label className="checkout-form-label">
                          Referencias (opcional)
                        </label>
                        <input
                          type="text"
                          name="reference"
                          value={formData.reference}
                          onChange={handleInputChange}
                          className="checkout-form-input"
                          placeholder="Entre calles, color de la casa, etc."
                        />
                      </div>
                    </>
                  ) : (
                    <div className="checkout-pickup-info">
                      <Clock size={48} className="checkout-pickup-icon" />
                      <h4>Tu pedido estará listo en 20-30 minutos</h4>
                      <div className="checkout-pickup-details">
                        <p><strong>Dirección:</strong> Av. Principal 456, Santiago Centro</p>
                        <p><strong>Horario:</strong> Lun-Dom 12:00 - 23:00</p>
                        <p><strong>Teléfono:</strong> +56 2 1234 5678</p>
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
                  <h3 className="checkout-section-title">Método de Pago</h3>
                  
                  <div className="checkout-payment-options">
                    <label className="checkout-payment-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={formData.paymentMethod === 'cash'}
                        onChange={handleInputChange}
                      />
                      <div className="checkout-payment-content">
                        <DollarSign size={24} />
                        <div>
                          <h4>Efectivo</h4>
                          <p>Paga al recibir tu pedido</p>
                        </div>
                      </div>
                    </label>

                    {formData.paymentMethod === 'cash' && (
                      <div className="checkout-cash-amount">
                        <label className="checkout-form-label">
                          ¿Con cuánto pagarás?
                        </label>
                        <input
                          type="number"
                          name="cashAmount"
                          value={formData.cashAmount}
                          onChange={handleInputChange}
                          className="checkout-form-input"
                          placeholder={formatPrice(total + 5000)}
                        />
                        <span className="checkout-form-hint">Para preparar tu vuelto</span>
                      </div>
                    )}

                    <label className="checkout-payment-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={formData.paymentMethod === 'transfer'}
                        onChange={handleInputChange}
                      />
                      <div className="checkout-payment-content">
                        <CreditCard size={24} />
                        <div>
                          <h4>Transferencia</h4>
                          <p>Te enviaremos los datos por WhatsApp</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="checkout-form-group">
                    <label className="checkout-form-label">
                      <MessageSquare size={18} />
                      Notas para el pedido (opcional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="checkout-form-input"
                      placeholder="Ej: Sin cebolla, extra queso, timbre no funciona..."
                    />
                  </div>

                  {/* Resumen del pedido */}
                  <div className="checkout-order-summary">
                    <h4>Resumen del Pedido</h4>
                    <div className="checkout-summary-items">
                      {cart.map(item => (
                        <div key={item.id} className="checkout-summary-item">
                          <span>{item.quantity}x {item.name}</span>
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
                          <span>{formatPrice(deliveryFee)}</span>
                        </div>
                      )}
                      <div className="checkout-summary-row checkout-summary-total">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!orderSuccess && (
          <div className="checkout-modal-footer">
            <div className="checkout-footer-total">
              <span>Total:</span>
              <span className="checkout-footer-amount">{formatPrice(total)}</span>
            </div>
            
            {currentStep < 3 ? (
              <button
                onClick={handleNextStep}
                className="btn btn-primary checkout-continue-btn"
              >
                Continuar
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmitOrder}
                disabled={loading}
                className="btn btn-primary checkout-confirm-btn"
              >
                {loading ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;