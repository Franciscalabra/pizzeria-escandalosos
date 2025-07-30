// src/components/Cart/CartItem.jsx
import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import './Cart.css';

const CartItem = ({ item, updateQuantity, removeItem }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      updateQuantity(item.id, newQuantity);
    }
  };

  const hasCustomizations = () => {
    return (
      item.customizations?.specialInstructions ||
      item.customizations?.extraIngredients?.length > 0 ||
      item.customizations?.removedIngredients?.length > 0 ||
      item.customizations?.variationDetails ||
      item.customizations?.productAddons?.length > 0
    );
  };

  return (
    <div className="cart-item">
      <div className="cart-item-image-container">
        <img 
          src={item.image || '/placeholder.jpg'} 
          alt={item.name} 
          className="cart-item-image"
        />
      </div>
      
      <div className="cart-item-details">
        <h3 className="cart-item-name">{item.name}</h3>
        
        {hasCustomizations() && (
          <div className="cart-item-customizations">
            {/* Variaciones */}
            {item.customizations?.variationDetails && (
              <div className="customization-group">
                {item.customizations.variationDetails.attributes?.map((attr, index) => (
                  <span key={index} className="customization-item variation">
                    {attr.name}: {attr.option}
                  </span>
                ))}
              </div>
            )}
            
            {/* Campos de Advanced Product Fields */}
            {item.customizations?.productAddons?.length > 0 && (
              <div className="customization-group">
                <span className="customization-label">Personalización:</span>
                {item.customizations.productAddons.map((addon, index) => (
                  <span key={index} className="customization-item addon">
                    {addon.display || addon.key}: {addon.value}
                    {addon.price > 0 && ` (+${formatPrice(addon.price)})`}
                  </span>
                ))}
              </div>
            )}
            
            {/* Ingredientes extra */}
            {item.customizations?.extraIngredients?.length > 0 && (
              <div className="customization-group">
                <span className="customization-label">Extras:</span>
                {item.customizations.extraIngredients.map((extra, index) => (
                  <span key={index} className="customization-item extra">
                    + {extra.name} ({formatPrice(extra.price)})
                  </span>
                ))}
              </div>
            )}
            
            {/* Ingredientes removidos */}
            {item.customizations?.removedIngredients?.length > 0 && (
              <div className="customization-group">
                <span className="customization-label">Sin:</span>
                {item.customizations.removedIngredients.map((removed, index) => (
                  <span key={index} className="customization-item removed">
                    - {removed}
                  </span>
                ))}
              </div>
            )}
            
            {/* Instrucciones especiales */}
            {item.customizations?.specialInstructions && (
              <div className="customization-group">
                <span className="customization-label">Nota:</span>
                <span className="customization-item note">
                  {item.customizations.specialInstructions}
                </span>
              </div>
            )}
          </div>
        )}
        
        <div className="cart-item-price-info">
          <span className="cart-item-unit-price">
            {formatPrice(item.price)} c/u
          </span>
        </div>
      </div>
      
      <div className="cart-item-actions">
        <div className="quantity-controls">
          <button 
            className="quantity-btn"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus size={16} />
          </button>
          <span className="quantity-value">{item.quantity}</span>
          <button 
            className="quantity-btn"
            onClick={() => handleQuantityChange(item.quantity + 1)}
          >
            <Plus size={16} />
          </button>
        </div>
        
        <div className="cart-item-total">
          {formatPrice(item.price * item.quantity)}
        </div>
        
        <button 
          className="remove-btn"
          onClick={() => removeItem(item.id)}
          title="Eliminar del carrito"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;