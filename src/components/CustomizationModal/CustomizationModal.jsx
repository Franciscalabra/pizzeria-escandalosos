// src/components/CustomizationModal/CustomizationModal.jsx
import React, { useState, useContext, useEffect } from 'react';
import { X, Plus, Minus, Info, Check } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import './CustomizationModal.css';

const CustomizationModal = ({ product, isOpen, onClose }) => {
  const { addToCart } = useContext(CartContext);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [extraIngredients, setExtraIngredients] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  // Configuración de ejemplo - esto vendría de WooCommerce
  const sizes = [
    { id: 'personal', name: 'Personal', price: 0 },
    { id: 'mediana', name: 'Mediana', price: 2000 },
    { id: 'familiar', name: 'Familiar', price: 4000 },
    { id: 'gigante', name: 'Gigante', price: 6000 }
  ];

  const availableIngredients = [
    { id: 'queso', name: 'Queso Extra', price: 1500 },
    { id: 'pepperoni', name: 'Pepperoni', price: 2000 },
    { id: 'champinones', name: 'Champiñones', price: 1500 },
    { id: 'jamon', name: 'Jamón', price: 1800 },
    { id: 'pina', name: 'Piña', price: 1500 },
    { id: 'aceituna', name: 'Aceitunas', price: 1200 },
    { id: 'cebolla', name: 'Cebolla', price: 1000 },
    { id: 'pimenton', name: 'Pimentón', price: 1200 }
  ];

  const defaultIngredients = ['queso', 'salsa', 'oregano'];

  useEffect(() => {
    if (product && sizes.length > 0) {
      setSelectedSize(sizes[0]);
    }
  }, [product]);

  useEffect(() => {
    calculateTotal();
  }, [selectedSize, extraIngredients, quantity]);

  const calculateTotal = () => {
    if (!product || !selectedSize) return;
    
    let basePrice = parseFloat(product.price);
    let sizePrice = selectedSize.price;
    let extrasPrice = extraIngredients.reduce((sum, extra) => sum + extra.price, 0);
    
    setTotalPrice((basePrice + sizePrice + extrasPrice) * quantity);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleIngredientToggle = (ingredient) => {
    if (extraIngredients.find(item => item.id === ingredient.id)) {
      setExtraIngredients(extraIngredients.filter(item => item.id !== ingredient.id));
    } else {
      setExtraIngredients([...extraIngredients, ingredient]);
    }
  };

  const handleRemoveIngredient = (ingredientId) => {
    if (removedIngredients.includes(ingredientId)) {
      setRemovedIngredients(removedIngredients.filter(id => id !== ingredientId));
    } else {
      setRemovedIngredients([...removedIngredients, ingredientId]);
    }
  };

  const handleAddToCart = () => {
    const customizations = {
      size: selectedSize,
      extraIngredients,
      removedIngredients,
      specialInstructions
    };

    addToCart({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: totalPrice / quantity,
      image: product.images?.[0]?.src || null,
      quantity,
      customizations
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="customization-modal-overlay" onClick={onClose}>
      <div className="customization-modal" onClick={(e) => e.stopPropagation()}>
        <div className="customization-header">
          <h2>Personaliza tu {product.name}</h2>
          <button className="customization-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="customization-content">
          {/* Imagen y descripción */}
          <div className="customization-product-info">
            {product.images?.[0]?.src && (
              <img 
                src={product.images[0].src} 
                alt={product.name}
                className="customization-product-image"
              />
            )}
            <div>
              <h3>{product.name}</h3>
              {product.short_description && (
                <p dangerouslySetInnerHTML={{ __html: product.short_description }} />
              )}
            </div>
          </div>

          {/* Selección de tamaño */}
          <div className="customization-section">
            <h4>Elige el tamaño</h4>
            <div className="size-options">
              {sizes.map(size => (
                <label key={size.id} className="size-option">
                  <input
                    type="radio"
                    name="size"
                    value={size.id}
                    checked={selectedSize?.id === size.id}
                    onChange={() => setSelectedSize(size)}
                  />
                  <div className="size-option-content">
                    <span className="size-name">{size.name}</span>
                    {size.price > 0 && (
                      <span className="size-price">+{formatPrice(size.price)}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Ingredientes por defecto */}
          <div className="customization-section">
            <h4>Ingredientes incluidos</h4>
            <p className="section-description">Puedes quitar los que no desees</p>
            <div className="default-ingredients">
              {defaultIngredients.map(ingredient => (
                <div 
                  key={ingredient}
                  className={`ingredient-chip ${removedIngredients.includes(ingredient) ? 'removed' : ''}`}
                  onClick={() => handleRemoveIngredient(ingredient)}
                >
                  <span>{ingredient}</span>
                  {removedIngredients.includes(ingredient) ? <Plus size={16} /> : <X size={16} />}
                </div>
              ))}
            </div>
          </div>

          {/* Ingredientes extra */}
          <div className="customization-section">
            <h4>Agrega ingredientes extra</h4>
            <div className="extra-ingredients">
              {availableIngredients.map(ingredient => (
                <label key={ingredient.id} className="ingredient-option">
                  <input
                    type="checkbox"
                    checked={extraIngredients.some(item => item.id === ingredient.id)}
                    onChange={() => handleIngredientToggle(ingredient)}
                  />
                  <div className="ingredient-option-content">
                    <span className="ingredient-name">{ingredient.name}</span>
                    <span className="ingredient-price">+{formatPrice(ingredient.price)}</span>
                  </div>
                  <div className="ingredient-checkbox">
                    {extraIngredients.some(item => item.id === ingredient.id) && <Check size={16} />}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Instrucciones especiales */}
          <div className="customization-section">
            <h4>Instrucciones especiales (opcional)</h4>
            <textarea
              placeholder="Ej: Sin cebolla, poco cocida, extra crujiente..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="special-instructions"
              rows={3}
            />
          </div>

          {/* Cantidad */}
          <div className="customization-section">
            <h4>Cantidad</h4>
            <div className="quantity-selector">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="quantity-btn"
              >
                <Minus size={20} />
              </button>
              <span className="quantity-value">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="quantity-btn"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="customization-footer">
          <div className="total-info">
            <span>Total:</span>
            <span className="total-price">{formatPrice(totalPrice)}</span>
          </div>
          <button 
            className="btn btn-primary add-to-cart-btn"
            onClick={handleAddToCart}
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;