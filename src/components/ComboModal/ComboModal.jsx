import React, { useState, useContext, useEffect, useRef } from 'react';
import { X, Plus, Minus, Loader, Pizza, Check, ShoppingCart, ChevronRight, ChevronLeft, Package } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import woocommerceApi from '../../services/woocommerceApi';
import escandalososApi from '../../services/escandalososApi';
import './ComboModal.css';

const ComboModal = ({ product, isOpen, onClose }) => {
  const { addToCart } = useContext(CartContext);
  const modalRef = useRef(null);
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comboConfig, setComboConfig] = useState(null);
  const [availableProducts, setAvailableProducts] = useState({});
  const [selectedProducts, setSelectedProducts] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animationClass, setAnimationClass] = useState('');

  // Reset estados cuando se abre el modal
  useEffect(() => {
    if (isOpen && product) {
      resetForm();
      loadComboData();
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, product]);

  // Manejo de teclas (ESC para cerrar)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const resetForm = () => {
    setSelectedProducts({});
    setQuantity(1);
    setError(null);
    setCurrentStep(0);
    setAnimationClass('');
  };

  const loadComboData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtener configuración del plugin Escandalosos
      const escandalososConfig = await escandalososApi.getConfig();
      
      // Verificar si el producto es un combo
      const productConfig = escandalososConfig.products[product.id];
      if (!productConfig || !productConfig.is_combo) {
        throw new Error('Este producto no está configurado como combo');
      }
      
      setComboConfig(productConfig.combo_config);
      
      // Cargar productos para cada categoría del combo
      const productsToLoad = {};
      
      for (const [categoryId, config] of Object.entries(productConfig.combo_config)) {
        try {
          // Obtener productos de la categoría
          const categoryProducts = await woocommerceApi.getProducts({
            category: categoryId,
            status: 'publish',
            per_page: 100
          });
          
          productsToLoad[categoryId] = categoryProducts.filter(p => 
            p.id !== product.id && // Excluir el combo actual
            p.status === 'publish' &&
            p.catalog_visibility !== 'hidden'
          );
        } catch (err) {
          console.error(`Error cargando productos de categoría ${categoryId}:`, err);
          productsToLoad[categoryId] = [];
        }
      }
      
      setAvailableProducts(productsToLoad);
      initializeSelections(productConfig.combo_config);
      
    } catch (error) {
      console.error('Error cargando datos del combo:', error);
      setError('Error al cargar las opciones del combo. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const initializeSelections = (comboConfig) => {
    const initialSelections = {};
    
    Object.entries(comboConfig).forEach(([categoryId, config]) => {
      initialSelections[categoryId] = [];
    });
    
    setSelectedProducts(initialSelections);
  };

  const handleProductToggle = (categoryId, productId) => {
    const category = comboConfig[categoryId];
    const currentSelections = selectedProducts[categoryId] || [];
    
    if (currentSelections.includes(productId)) {
      // Deseleccionar el producto
      setSelectedProducts(prev => ({
        ...prev,
        [categoryId]: currentSelections.filter(id => id !== productId)
      }));
    } else {
      // Seleccionar el producto
      if (category.maxSelection === 1) {
        // Si solo se permite una selección, reemplazar
        setSelectedProducts(prev => ({
          ...prev,
          [categoryId]: [productId]
        }));
      } else {
        // Para múltiples selecciones
        if (currentSelections.length < category.maxSelection) {
          setSelectedProducts(prev => ({
            ...prev,
            [categoryId]: [...currentSelections, productId]
          }));
        }
      }
    }
  };

  const isStepComplete = (categoryId) => {
    const category = comboConfig[categoryId];
    const selections = selectedProducts[categoryId] || [];
    return selections.length >= category.minSelection;
  };

  const canProceed = () => {
    const categoryIds = Object.keys(comboConfig);
    
    // Si estamos en el último paso de categorías, verificar si podemos ir al resumen
    if (currentStep === categoryIds.length - 1) {
      const currentCategoryId = categoryIds[currentStep];
      return isStepComplete(currentCategoryId) && canAddToCart();
    }
    
    // Para otros pasos, solo verificar si el paso actual está completo
    if (currentStep < categoryIds.length) {
      const currentCategoryId = categoryIds[currentStep];
      return isStepComplete(currentCategoryId);
    }
    
    return false;
  };

  const canAddToCart = () => {
    return Object.entries(comboConfig).every(([categoryId, config]) => {
      const selections = selectedProducts[categoryId] || [];
      return selections.length >= config.minSelection;
    });
  };

  const handleNextStep = () => {
    const categoryIds = Object.keys(comboConfig);
    
    if (currentStep < categoryIds.length - 1) {
      // Avanzar al siguiente paso de categoría
      setAnimationClass('fade-exit-active');
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setAnimationClass('fade-enter-active');
      }, 200);
    } else if (currentStep === categoryIds.length - 1) {
      // Ir al paso final de resumen
      setAnimationClass('fade-exit-active');
      setTimeout(() => {
        setCurrentStep(categoryIds.length);
        setAnimationClass('fade-enter-active');
      }, 200);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setAnimationClass('fade-exit-active');
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setAnimationClass('fade-enter-active');
      }, 200);
    }
  };

  const handleStepClick = (index) => {
    if (index <= currentStep || (index > 0 && isStepComplete(Object.keys(comboConfig)[index - 1]))) {
      setAnimationClass('fade-exit-active');
      setTimeout(() => {
        setCurrentStep(index);
        setAnimationClass('fade-enter-active');
      }, 200);
    }
  };

  const calculateTotalPrice = () => {
    const basePrice = parseFloat(product.price) || 0;
    return basePrice * quantity;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (!canAddToCart()) return;
    
    setAddingToCart(true);
    
    try {
      // Preparar información del combo
      const comboInfo = {
        selections: {}
      };
      
      // Mapear productos seleccionados con sus nombres
      for (const [categoryId, productIds] of Object.entries(selectedProducts)) {
        const categoryProducts = availableProducts[categoryId] || [];
        comboInfo.selections[categoryId] = productIds.map(id => {
          const product = categoryProducts.find(p => p.id === id);
          return {
            id,
            name: product?.name || 'Producto'
          };
        });
      }
      
      // Crear el item del carrito
      const cartItem = {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: quantity,
        image: product.images?.[0]?.src || null,
        type: 'combo',
        comboSelections: comboInfo.selections,
        comboConfig: comboConfig
      };
      
      // Agregar al carrito
      await addToCart(cartItem);
      
      // Cerrar modal con animación
      modalRef.current?.classList.add('closing');
      setTimeout(() => {
        onClose();
      }, 300);
      
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      setError('Error al agregar el combo al carrito');
    } finally {
      setAddingToCart(false);
    }
  };

  const renderProgressSteps = () => {
    if (!comboConfig) return null;
    
    const categoryIds = Object.keys(comboConfig);
    const isLastStep = currentStep >= categoryIds.length;
    
    if (isLastStep) return null; // No mostrar en el paso final
    
    return (
      <div className="progress-container">
        <div className="progress-steps">
          {categoryIds.map((categoryId, index) => {
            const category = comboConfig[categoryId];
            const isActive = index === currentStep;
            const isCompleted = isStepComplete(categoryId) && index < currentStep;
            const isClickable = index <= currentStep || (index > 0 && isStepComplete(categoryIds[index - 1]));
            
            return (
              <React.Fragment key={categoryId}>
                <div 
                  className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => isClickable && handleStepClick(index)}
                  style={{ cursor: isClickable ? 'pointer' : 'default' }}
                >
                  <div className="step-indicator">
                    {isCompleted ? <Check size={20} /> : index + 1}
                  </div>
                  <span className="step-label">{category.name}</span>
                </div>
                {index < categoryIds.length - 1 && (
                  <div className={`step-connector ${isCompleted ? 'completed' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCategoryProducts = () => {
    if (!comboConfig) return null;
    
    const categoryIds = Object.keys(comboConfig);
    
    // Verificar que no estamos en el paso final
    if (currentStep >= categoryIds.length) return null;
    
    const currentCategoryId = categoryIds[currentStep];
    const currentCategory = comboConfig[currentCategoryId];
    const products = availableProducts[currentCategoryId] || [];
    const selections = selectedProducts[currentCategoryId] || [];
    
    return (
      <div className={`category-section ${animationClass}`}>
        <div className="category-header">
          <h3 className="category-title">{currentCategory.name}</h3>
          <p className="category-description">
            Selecciona {currentCategory.minSelection === currentCategory.maxSelection 
              ? currentCategory.minSelection 
              : `entre ${currentCategory.minSelection} y ${currentCategory.maxSelection}`} 
            {currentCategory.minSelection === 1 ? ' opción' : ' opciones'}
          </p>
          {selections.length > 0 && (
            <div className="selection-indicator">
              <Check size={16} />
              {selections.length} de {currentCategory.maxSelection} seleccionado{selections.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        <div className="products-grid">
          {products.map(prod => {
            const isSelected = selections.includes(prod.id);
            const isDisabled = !isSelected && selections.length >= currentCategory.maxSelection;
            
            return (
              <div
                key={prod.id}
                className={`product-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && handleProductToggle(currentCategoryId, prod.id)}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                onKeyPress={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
                    handleProductToggle(currentCategoryId, prod.id);
                  }
                }}
              >
                <div className="product-image-container">
                  {prod.images && prod.images[0] ? (
                    <img 
                      src={prod.images[0].src} 
                      alt={prod.name}
                      className="product-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      <Pizza size={40} />
                    </div>
                  )}
                  <div className="selection-badge">
                    <Check size={20} />
                  </div>
                </div>
                
                <div className="product-info">
                  <h4 className="product-name">{prod.name}</h4>
                  {prod.short_description && (
                    <p className="product-description" 
                       dangerouslySetInnerHTML={{ __html: prod.short_description }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {products.length === 0 && (
          <div className="state-container">
            <Package size={64} color="var(--text-light)" />
            <p className="state-message">No hay productos disponibles en esta categoría</p>
          </div>
        )}
      </div>
    );
  };

  const renderFinalStep = () => {
    return (
      <div className="summary-section">
        <div className="summary-header">
          <h3 className="summary-title">¡Tu combo está listo!</h3>
          <p className="summary-price">{formatPrice(product.price)}</p>
        </div>

        <div className="selections-summary">
          {Object.entries(selectedProducts).map(([categoryId, productIds]) => {
            const category = comboConfig[categoryId];
            const categoryProducts = availableProducts[categoryId] || [];
            
            if (productIds.length === 0) return null;
            
            return (
              <div key={categoryId} className="selection-category">
                <h4 className="selection-category-name">{category.name}</h4>
                <div className="selected-items">
                  {productIds.map(id => {
                    const product = categoryProducts.find(p => p.id === id);
                    return (
                      <span key={id} className="selected-item-tag">
                        {product?.name || 'Producto'}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="quantity-section">
          <div className="quantity-control">
            <span className="quantity-label">Cantidad</span>
            <div className="quantity-selector">
              <button 
                className="quantity-button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Disminuir cantidad"
              >
                <Minus size={20} />
              </button>
              <span className="quantity-display">{quantity}</span>
              <button 
                className="quantity-button"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Aumentar cantidad"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          
          <div className="total-section">
            <p className="total-label">Total</p>
            <p className="total-amount">{formatPrice(calculateTotalPrice())}</p>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const categoryIds = Object.keys(comboConfig || {});
  const isLastStep = currentStep >= categoryIds.length;
  const isOnCategoryStep = currentStep < categoryIds.length;

  return (
    <div className="combo-modal-overlay" onClick={onClose}>
      <div 
        ref={modalRef}
        className="combo-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="combo-modal-title"
      >
        <div className="modal-handle" />
        
        <button 
          className="modal-close" 
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          <X size={24} />
        </button>
        
        <div className="combo-header">
          <h2 id="combo-modal-title" className="combo-title">
            {isLastStep ? 'Confirma tu pedido' : 'Arma tu combo perfecto'}
          </h2>
          <p className="combo-subtitle">
            {isLastStep 
              ? 'Revisa tu selección y agrega al carrito' 
              : `Personaliza tu ${product?.name || 'combo'} paso a paso`}
          </p>
        </div>
        
        {renderProgressSteps()}
        
        {loading ? (
          <div className="state-container">
            <Loader className="loading-spinner" size={48} />
            <p className="state-message">Cargando opciones del combo...</p>
          </div>
        ) : error ? (
          <div className="state-container">
            <p className="error-message">{error}</p>
            <button onClick={loadComboData} className="retry-button">
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <div className="combo-content">
              {isOnCategoryStep ? renderCategoryProducts() : renderFinalStep()}
            </div>

            <div className="modal-footer">
              <button 
                className="nav-button secondary"
                onClick={handlePreviousStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft size={20} />
                <span>Anterior</span>
              </button>
              
              {isOnCategoryStep ? (
                <button 
                  className="nav-button primary"
                  onClick={handleNextStep}
                  disabled={!canProceed()}
                >
                  <span>Siguiente</span>
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button 
                  className="add-to-cart-button"
                  onClick={handleAddToCart}
                  disabled={addingToCart || !canAddToCart()}
                >
                  {addingToCart ? (
                    <>
                      <Loader className="loading-spinner" size={20} />
                      <span>Agregando...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      <span>Agregar al Carrito</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ComboModal;