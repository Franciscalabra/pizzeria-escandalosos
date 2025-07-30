// src/components/CustomizationModal/CustomizationModal.jsx
import React, { useState, useContext, useEffect } from 'react';
import { X, Plus, Minus, Info, Check, Loader } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import woocommerceApi from '../../services/woocommerceApi';
import './CustomizationModal.css';

const CustomizationModal = ({ product, isOpen, onClose }) => {
  const { addToCart } = useContext(CartContext);
  
  // Estados para datos de WooCommerce
  const [variations, setVariations] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de selección
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  // Cargar variaciones y atributos cuando se abre el modal
  useEffect(() => {
    if (isOpen && product) {
      loadProductData();
    }
  }, [isOpen, product]);

  // Actualizar precio cuando cambia la selección
  useEffect(() => {
    updatePrice();
  }, [selectedVariation, quantity]);

  const loadProductData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Si es un producto variable, cargar variaciones
      if (product.type === 'variable') {
        const variationsData = await woocommerceApi.getProductVariations(product.id);
        setVariations(variationsData);
        
        // Extraer atributos del producto
        if (product.attributes) {
          setAttributes(product.attributes.filter(attr => attr.variation));
        }
      }
    } catch (err) {
      console.error('Error loading product data:', err);
      setError('Error al cargar las opciones del producto');
    } finally {
      setLoading(false);
    }
  };

  const handleAttributeChange = (attributeName, value) => {
    const newAttributes = {
      ...selectedAttributes,
      [attributeName]: value
    };
    setSelectedAttributes(newAttributes);
    
    // Buscar variación que coincida con los atributos seleccionados
    findMatchingVariation(newAttributes);
  };

  const findMatchingVariation = (attributes) => {
    if (!variations.length) return;
    
    const matching = variations.find(variation => {
      return variation.attributes.every(attr => {
        return attributes[attr.name] === attr.option;
      });
    });
    
    setSelectedVariation(matching);
  };

  const updatePrice = () => {
    if (selectedVariation) {
      setTotalPrice(parseFloat(selectedVariation.price) * quantity);
    } else if (product) {
      setTotalPrice(parseFloat(product.price) * quantity);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const isValidSelection = () => {
    if (product.type === 'variable') {
      // Para productos variables, verificar que se haya seleccionado una variación
      return selectedVariation !== null;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!isValidSelection()) {
      alert('Por favor, selecciona todas las opciones requeridas');
      return;
    }

    const cartItem = {
      id: selectedVariation ? `${product.id}-${selectedVariation.id}` : product.id,
      productId: product.id,
      variationId: selectedVariation?.id,
      name: product.name,
      price: selectedVariation ? parseFloat(selectedVariation.price) : parseFloat(product.price),
      image: selectedVariation?.image?.src || product.images?.[0]?.src || '',
      quantity,
      customizations: {
        attributes: selectedAttributes,
        specialInstructions,
        variationName: selectedVariation?.name || ''
      }
    };

    addToCart(cartItem);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSelectedAttributes({});
    setSelectedVariation(null);
    setQuantity(1);
    setSpecialInstructions('');
  };

  if (!isOpen || !product) return null;

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
          {loading ? (
            <div className="loading-container">
              <Loader className="spinner" size={40} />
              <p>Cargando opciones...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button onClick={loadProductData} className="retry-button">
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {/* Imagen y descripción del producto */}
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

              {/* Atributos del producto (tamaño, color, etc.) */}
              {attributes.length > 0 && (
                <div className="customization-section">
                  {attributes.map(attribute => (
                    <div key={attribute.id} className="attribute-section">
                      <h4>{attribute.name}</h4>
                      <div className="attribute-options">
                        {attribute.options.map(option => (
                          <label key={option} className="attribute-option">
                            <input
                              type="radio"
                              name={attribute.name}
                              value={option}
                              checked={selectedAttributes[attribute.name] === option}
                              onChange={() => handleAttributeChange(attribute.name, option)}
                            />
                            <span className="option-label">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mostrar información de la variación seleccionada */}
              {selectedVariation && (
                <div className="variation-info">
                  <div className="variation-price">
                    <span>Precio:</span>
                    <span className="price">{formatPrice(selectedVariation.price)}</span>
                  </div>
                  {selectedVariation.stock_status === 'outofstock' && (
                    <p className="out-of-stock">Agotado</p>
                  )}
                </div>
              )}

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

              {/* Selector de cantidad */}
              <div className="customization-section">
                <h4>Cantidad</h4>
                <div className="quantity-selector">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="quantity-btn"
                    aria-label="Disminuir cantidad"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="quantity-btn"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="customization-footer">
          <div className="total-info">
            <span>Total:</span>
            <span className="total-price">{formatPrice(totalPrice)}</span>
          </div>
          <button 
            className="btn btn-primary add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={loading || !isValidSelection()}
          >
            {loading ? 'Cargando...' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;