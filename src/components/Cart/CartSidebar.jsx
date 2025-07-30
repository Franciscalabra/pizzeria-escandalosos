// src/components/Cart/CartSidebar.jsx
import React, { useContext } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import './CartSidebar.css';

const CartSidebar = ({ isOpen, onClose }) => {
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal } = useContext(CartContext);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const handleCheckout = () => {
    // Aquí implementarás la lógica de checkout con WooCommerce
    alert('Implementar checkout con WooCommerce');
  };

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      
      <aside className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2 className="cart-title">Tu Pedido</h2>
          <button className="cart-close" onClick={onClose} aria-label="Cerrar carrito">
            <X size={24} />
          </button>
        </div>

        <div className="cart-content">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={64} />
              <p>Tu carrito está vacío</p>
              <button className="btn btn-primary" onClick={onClose}>
                Ir al Menú
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <div className="cart-item-placeholder">
                          <ShoppingBag size={24} />
                        </div>
                      )}
                    </div>
                    
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <p className="cart-item-price">{formatPrice(item.price)}</p>
                    </div>
                    
                    <div className="cart-item-actions">
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Disminuir cantidad"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button 
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      <button 
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Eliminar producto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="cart-item-total">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <button className="clear-cart-btn" onClick={clearCart}>
                  Vaciar Carrito
                </button>
                
                <div className="cart-totals">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(getCartTotal())}</span>
                  </div>
                  <div className="total-row">
                    <span>Delivery</span>
                    <span>Por calcular</span>
                  </div>
                  <div className="total-row total-final">
                    <span>Total</span>
                    <span>{formatPrice(getCartTotal())}</span>
                  </div>
                </div>
                
                <button className="btn btn-primary checkout-btn" onClick={handleCheckout}>
                  Proceder al Pago
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default CartSidebar;