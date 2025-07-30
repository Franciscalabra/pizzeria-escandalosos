// src/components/CustomizationModal/CustomizationModal.jsx
import React, { useState, useContext, useEffect } from 'react';
import { X, Plus, Minus, Info, Check, Loader, Pizza } from 'lucide-react';
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
  const [addingToCart, setAddingToCart] = useState(false);

  // Reset estados cuando se abre el modal
  useEffect(() => {
    if (isOpen && product) {
      resetForm();
      loadProductData();
    }
  }, [isOpen, product]);

  // Actualizar precio cuando cambia la selección
  useEffect(() => {
    updatePrice();
  }, [selectedVariation, quantity, product]);

  const resetForm = () => {
    setSelectedAttributes({});
    setSelectedVariation(null);
    setQuantity(1);
    setSpecialInstructions('');
    setError(null);
  };

  const loadProductData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Si es un producto variable, cargar variaciones
      if (product.type === 'variable') {
        const variationsData = await woocommerceApi.getProductVariations(product.id);
        setVariations(variationsData || []);
        
        // Extraer atributos del producto
        if (product.attributes) {
          const variableAttributes = product.attributes.filter(attr => attr.variation);
          setAttributes(variableAttributes);
          
          // Establecer valores por defecto
          const defaultAttributes = {};
          variableAttributes.forEach(attr => {
            if (attr.options && attr.options.length > 0) {
              defaultAttributes[attr.name] = attr.options[0];
            }
          });
          setSelectedAttributes(defaultAttributes);
          
          // Buscar variación por defecto
          findMatchingVariation(defaultAttributes);
        }
      } else {
        // Para productos simples, establecer el precio directamente
        setTotalPrice(parseFloat(product.price) * quantity);
      }
    } catch (err) {
      console.error('Error loading product data:', err);
      setError('Error al cargar las opciones del producto. Por favor, intenta de nuevo.');
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
    if (!variations || variations.length === 0) return;
    
    const matching = variations.find(variation => {
      return variation.attributes.every(attr => {
        const normalizedAttrName = attr.name.toLowerCase().replace(/-/g, ' ');
        const selectedValue = attributes[attr.name] || attributes[normalizedAttrName];
        return selectedValue === attr.option;
      });
    });
    
    setSelectedVariation(matching || null);
  };

  const updatePrice = () => {
    let price = 0;
    
    if (selectedVariation && selectedVariation.price) {
      price = parseFloat(selectedVariation.price);
    } else if (product && product.price) {
      price = parseFloat(product.price);
    }
    
    setTotalPrice(price * quantity);
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
      // Para productos variables, verificar que se haya seleccionado una variación válida
      return selectedVariation !== null && selectedVariation.stock_status !== 'outofstock';
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!isValidSelection()) {
      setError('Por favor, selecciona todas las opciones requeridas');
      return;
    }

    setAddingToCart(true);

    try {
      const cartItem = {
        id: selectedVariation ? `${product.id}-${selectedVariation.id}-${Date.now()}` : `${product.id}-${Date.now()}`,
        productId: product.id,
        variationId: selectedVariation?.id,
        name: product.name,
        price: selectedVariation ? parseFloat(selectedVariation.price) : parseFloat(product.price),
        image: selectedVariation?.image?.src || product.images?.[0]?.src || '',
        quantity,
        customizations: {
          attributes: selectedAttributes,
          specialInstructions: specialInstructions.trim(),
          variationDetails: selectedVariation ? {
            name: selectedVariation.name,
            attributes: selectedVariation.attributes
          } : null
        }
      };

      addToCart(cartItem);
      
      // Mostrar mensaje de éxito
      setTimeout(() => {
        onClose();
        resetForm();
      }, 500);
      
    } catch (err) {
      setError('Error al agregar al carrito. Por favor, intenta de nuevo.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="customization-modal-overlay" onClick={handleOverlayClick}>
      <div className="customization-modal">
        <div className="customization-header">
          <h2>Personaliza tu {product.name}</h2>
          <button className="customization-close" onClick={onClose} aria-label="Cerrar">
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
                {product.images?.[0]?.src ? (
                  <img 
                    src={product.images[0].src} 
                    alt={product.name}
                    className="customization-product-image"
                  />
                ) : (
                  <div className="customization-product-image placeholder">
                    <Pizza size={40} />
                  </div>
                )}
                <div className="product-details">
                  <h3>{product.name}</h3>
                  {product.short_description && (
                    <p className="product-description" 
                       dangerouslySetInnerHTML={{ __html: product.short_description }} 
                    />
                  )}
                </div>
              </div>

              {/* Atributos del producto (tamaño, masa, etc.) */}
              {attributes.length > 0 && (
                <div className="customization-section">
                  {attributes.map(attribute => (
                    <div key={attribute.id || attribute.name} className="attribute-section">
                      <h4>{attribute.name}</h4>
                      {attribute.description && (
                        <p className="section-description">{attribute.description}</p>
                      )}
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
                            <span className="option-label">
                              <span className="option-check">
                                <Check size={16} />
                              </span>
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mostrar información de la variación seleccionada */}
              {selectedVariation && (selectedVariation.stock_status === 'outofstock' || 
                (selectedVariation.stock_quantity && selectedVariation.stock_quantity < 10)) && (
                <div className="variation-info">
                  <div className="variation-details">
                    {selectedVariation.stock_status === 'outofstock' ? (
                      <p className="out-of-stock">⚠️ Producto agotado</p>
                    ) : selectedVariation.stock_quantity && selectedVariation.stock_quantity < 10 ? (
                      <p className="low-stock">⚡ Últimas {selectedVariation.stock_quantity} unidades</p>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Instrucciones especiales */}
              <div className="customization-section">
                <h4>Instrucciones especiales (opcional)</h4>
                <p className="section-description">
                  ¿Alguna preferencia especial? Cuéntanos aquí
                </p>
                <textarea
                  placeholder="Ej: Sin cebolla, poco cocida, extra crujiente..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="special-instructions"
                  rows={3}
                  maxLength={200}
                />
                <span className="char-count">{specialInstructions.length}/200</span>
              </div>

              {/* Selector de cantidad */}
              <div className="customization-section">
                <h4>Cantidad</h4>
                <div className="quantity-controls">
                  <div className="quantity-selector">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="quantity-btn"
                      aria-label="Disminuir cantidad"
                      disabled={quantity <= 1}
                    >
                      <Minus size={20} />
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="quantity-btn"
                      aria-label="Aumentar cantidad"
                      disabled={quantity >= 10}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="quantity-price">
                    <span className="price-label">Precio unitario:</span>
                    <span className="price-value">
                      {formatPrice(totalPrice / quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="customization-footer">
          <div className="total-info">
            <span className="total-label">Total:</span>
            <span className="total-price">{formatPrice(totalPrice)}</span>
          </div>
          <button 
            className={`btn btn-primary add-to-cart-btn ${addingToCart ? 'adding' : ''}`}
            onClick={handleAddToCart}
            disabled={loading || !isValidSelection() || addingToCart}
          >
            {addingToCart ? (
              <>
                <Loader size={20} className="btn-loader" />
                Agregando...
              </>
            ) : (
              'Agregar al carrito'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;