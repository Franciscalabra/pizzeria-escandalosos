// src/components/CustomizationModal/CustomizationModal.jsx
import React, { useState, useContext, useEffect } from 'react';
import { X, Plus, Minus, Info, Check, Loader, Pizza, Upload } from 'lucide-react';
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
  
  // Estados para Advanced Product Fields
  const [productAddons, setProductAddons] = useState([]);
  const [addonValues, setAddonValues] = useState({});
  const [addonFiles, setAddonFiles] = useState({});
  
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
  }, [selectedVariation, quantity, product, addonValues]);

  const resetForm = () => {
    setSelectedAttributes({});
    setSelectedVariation(null);
    setQuantity(1);
    setSpecialInstructions('');
    setProductAddons([]);
    setAddonValues({});
    setAddonFiles({});
    setError(null);
  };

  const loadProductData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Debugging: Ver toda la estructura del producto
      console.log('=== PRODUCTO COMPLETO ===');
      console.log(product);
      console.log('=== META DATA ===');
      console.log(product.meta_data);
      console.log('=== TODAS LAS PROPIEDADES ===');
      console.log(Object.keys(product));
      
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

      // Cargar Advanced Product Fields si existen
      loadProductAddons();
      
    } catch (err) {
      console.error('Error loading product data:', err);
      setError('Error al cargar las opciones del producto. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const loadProductAddons = async () => {
    console.log('=== BUSCANDO ADDONS ===');
    
    // Verificar si el producto tiene campos adicionales del plugin Advanced Product Fields
    if (product.meta_data) {
      console.log('Meta data encontrada:', product.meta_data);
      
      // Buscar el campo _wapf_fieldgroup
      const fieldGroupData = product.meta_data.find(meta => meta.key === '_wapf_fieldgroup');
      
      if (fieldGroupData && fieldGroupData.value) {
        console.log('Field group data encontrada:', fieldGroupData.value);
        
        // El valor puede ser un ID de grupo o un array de IDs
        let groupIds = [];
        if (Array.isArray(fieldGroupData.value)) {
          groupIds = fieldGroupData.value;
        } else if (typeof fieldGroupData.value === 'object' && fieldGroupData.value.groups) {
          groupIds = fieldGroupData.value.groups;
        } else if (typeof fieldGroupData.value === 'string' || typeof fieldGroupData.value === 'number') {
          groupIds = [fieldGroupData.value];
        }
        
        console.log('Group IDs:', groupIds);
        
        // Si tenemos IDs de grupos, necesitamos obtener los campos de esos grupos
        // Para esto necesitamos hacer una petición adicional o el plugin debe exponer los campos
        
        // Por ahora, vamos a buscar si hay campos directamente en el producto
        // El plugin también puede guardar los campos compilados en otro meta field
        const possibleFieldKeys = [
          '_wapf_fields',
          '_wapf_field_groups_fields',
          'wapf_fields',
          '_product_addons'
        ];
        
        for (const key of possibleFieldKeys) {
          const fieldsData = product.meta_data.find(meta => meta.key === key);
          if (fieldsData && fieldsData.value) {
            console.log(`Campos encontrados con key "${key}":`, fieldsData.value);
            const fields = Array.isArray(fieldsData.value) ? fieldsData.value : [fieldsData.value];
            setProductAddons(fields);
            initializeAddonValues(fields);
            return;
          }
        }
        
        // Si no encontramos los campos compilados, intentamos obtenerlos via API personalizada
        if (groupIds.length > 0) {
          console.log('Intentando obtener campos del grupo via API...');
          try {
            // Primero intentamos con el endpoint personalizado si existe
            const response = await fetch(`/wp-json/custom/v1/product-fields/${product.id}`);
            if (response.ok) {
              const fields = await response.json();
              console.log('Campos obtenidos via API personalizada:', fields);
              if (fields && fields.fields) {
                setProductAddons(fields.fields);
                initializeAddonValues(fields.fields);
                return;
              }
            }
          } catch (error) {
            console.log('Error obteniendo campos via API:', error);
          }
        }
      }
    }
    
    // Si no encontramos campos via meta_data, verificar si están directamente en el producto
    if (product.product_fields) {
      console.log('Campos encontrados en product.product_fields:', product.product_fields);
      setProductAddons(product.product_fields);
      initializeAddonValues(product.product_fields);
    } else if (product.addons) {
      console.log('Campos encontrados en product.addons:', product.addons);
      setProductAddons(product.addons);
      initializeAddonValues(product.addons);
    }
    
    console.log('=== ESTADO FINAL DE ADDONS ===');
    console.log('productAddons:', productAddons);
  };

  const initializeAddonValues = (fields) => {
    const defaultValues = {};
    fields.forEach(field => {
      const fieldId = field.id || field.name || field.field_id;
      
      if (field.type === 'checkbox' || field.type === 'checkboxes' || field.type === 'multiple_choice') {
        defaultValues[fieldId] = [];
      } else if (field.type === 'number' && field.min !== undefined) {
        defaultValues[fieldId] = field.min;
      } else if (field.type === 'true_false') {
        defaultValues[fieldId] = false;
      } else {
        defaultValues[fieldId] = '';
      }
    });
    setAddonValues(defaultValues);
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

  const handleAddonChange = (fieldId, value) => {
    setAddonValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleFileUpload = (fieldId, file) => {
    if (file) {
      setAddonFiles(prev => ({
        ...prev,
        [fieldId]: file
      }));
      setAddonValues(prev => ({
        ...prev,
        [fieldId]: file.name
      }));
    }
  };

  const calculateAddonPrice = () => {
    let addonTotal = 0;
    
    productAddons.forEach(addon => {
      const fieldId = addon.id || addon.name;
      const value = addonValues[fieldId];
      
      if (!value || (Array.isArray(value) && value.length === 0)) return;
      
      // Precio fijo
      if (addon.price_type === 'flat_fee' && addon.price) {
        addonTotal += parseFloat(addon.price);
      }
      
      // Precio basado en cantidad
      else if (addon.price_type === 'quantity_based' && addon.price) {
        addonTotal += parseFloat(addon.price) * quantity;
      }
      
      // Precio por carácter (para campos de texto)
      else if (addon.price_type === 'per_char' && addon.price && typeof value === 'string') {
        addonTotal += parseFloat(addon.price) * value.length;
      }
      
      // Para campos con opciones (radio, select, checkbox)
      else if (addon.options && Array.isArray(addon.options)) {
        addon.options.forEach(option => {
          const isSelected = Array.isArray(value) 
            ? value.includes(option.label || option.value)
            : value === (option.label || option.value);
            
          if (isSelected && option.price) {
            if (option.price_type === 'quantity_based') {
              addonTotal += parseFloat(option.price) * quantity;
            } else {
              addonTotal += parseFloat(option.price);
            }
          }
        });
      }
    });
    
    return addonTotal;
  };

  const updatePrice = () => {
    let basePrice = 0;
    
    if (selectedVariation && selectedVariation.price) {
      basePrice = parseFloat(selectedVariation.price);
    } else if (product && product.price) {
      basePrice = parseFloat(product.price);
    }
    
    const addonPrice = calculateAddonPrice();
    setTotalPrice((basePrice + addonPrice) * quantity);
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
      if (!selectedVariation || selectedVariation.stock_status === 'outofstock') {
        return false;
      }
    }
    
    // Validar campos requeridos de Advanced Product Fields
    for (const addon of productAddons) {
      if (addon.required) {
        const fieldId = addon.id || addon.name;
        const value = addonValues[fieldId];
        
        if (!value || (Array.isArray(value) && value.length === 0)) {
          setError(`Por favor, completa el campo: ${addon.title || addon.name}`);
          return false;
        }
      }
    }
    
    return true;
  };

  const handleAddToCart = async () => {
    if (!isValidSelection()) {
      if (!error) {
        setError('Por favor, selecciona todas las opciones requeridas');
      }
      return;
    }

    setAddingToCart(true);

    try {
      // Preparar meta_data para Advanced Product Fields
      const addonMetaData = [];
      
      productAddons.forEach(addon => {
        const fieldId = addon.id || addon.name;
        const value = addonValues[fieldId];
        
        if (value && !(Array.isArray(value) && value.length === 0)) {
          // Agregar el campo a meta_data
          addonMetaData.push({
            key: addon.name || addon.title,
            value: Array.isArray(value) ? value.join(', ') : value,
            display: addon.title || addon.name,
            price: addon.price || 0,
            price_type: addon.price_type || 'flat_fee'
          });
        }
      });

      const cartItem = {
        id: selectedVariation ? `${product.id}-${selectedVariation.id}-${Date.now()}` : `${product.id}-${Date.now()}`,
        productId: product.id,
        variationId: selectedVariation?.id,
        name: product.name,
        price: totalPrice / quantity, // Precio unitario incluyendo addons
        image: selectedVariation?.image?.src || product.images?.[0]?.src || '',
        quantity,
        customizations: {
          attributes: selectedAttributes,
          specialInstructions: specialInstructions.trim(),
          variationDetails: selectedVariation ? {
            name: selectedVariation.name,
            attributes: selectedVariation.attributes
          } : null,
          // Agregar datos de Advanced Product Fields
          productAddons: addonMetaData,
          addonValues: addonValues,
          addonFiles: Object.keys(addonFiles).length > 0 ? addonFiles : null
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

  const renderAddonField = (addon) => {
    const fieldId = addon.id || addon.name;
    const value = addonValues[fieldId] || '';
    
    switch (addon.type) {
      case 'text':
      case 'custom_text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleAddonChange(fieldId, e.target.value)}
            placeholder={addon.placeholder || ''}
            maxLength={addon.max || undefined}
            className="addon-text-input"
            required={addon.required}
          />
        );
        
      case 'textarea':
      case 'custom_textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleAddonChange(fieldId, e.target.value)}
            placeholder={addon.placeholder || ''}
            maxLength={addon.max || undefined}
            rows={4}
            className="addon-textarea"
            required={addon.required}
          />
        );
        
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleAddonChange(fieldId, parseFloat(e.target.value) || 0)}
            min={addon.min || undefined}
            max={addon.max || undefined}
            step={addon.step || 1}
            className="addon-number-input"
            required={addon.required}
          />
        );
        
      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleAddonChange(fieldId, e.target.value)}
            placeholder={addon.placeholder || 'email@ejemplo.com'}
            className="addon-email-input"
            required={addon.required}
          />
        );
        
      case 'select':
      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => handleAddonChange(fieldId, e.target.value)}
            className="addon-select"
            required={addon.required}
          >
            <option value="">Selecciona una opción</option>
            {addon.options?.map((option, index) => (
              <option key={index} value={option.label || option.value}>
                {option.label || option.value}
                {option.price && option.price > 0 && ` (+${formatPrice(option.price)})`}
              </option>
            ))}
          </select>
        );
        
      case 'radio':
      case 'radiobutton':
        return (
          <div className="addon-radio-group">
            {addon.options?.map((option, index) => (
              <label key={index} className="addon-radio-option">
                <input
                  type="radio"
                  name={fieldId}
                  value={option.label || option.value}
                  checked={value === (option.label || option.value)}
                  onChange={(e) => handleAddonChange(fieldId, e.target.value)}
                  required={addon.required}
                />
                <span className="radio-label">
                  {option.label || option.value}
                  {option.price && option.price > 0 && ` (+${formatPrice(option.price)})`}
                </span>
              </label>
            ))}
          </div>
        );
        
      case 'checkbox':
      case 'multiple_choice':
        return (
          <div className="addon-checkbox-group">
            {addon.options?.map((option, index) => (
              <label key={index} className="addon-checkbox-option">
                <input
                  type="checkbox"
                  value={option.label || option.value}
                  checked={Array.isArray(value) && value.includes(option.label || option.value)}
                  onChange={(e) => {
                    const optionValue = option.label || option.value;
                    const currentValues = Array.isArray(value) ? value : [];
                    
                    if (e.target.checked) {
                      handleAddonChange(fieldId, [...currentValues, optionValue]);
                    } else {
                      handleAddonChange(fieldId, currentValues.filter(v => v !== optionValue));
                    }
                  }}
                />
                <span className="checkbox-label">
                  {option.label || option.value}
                  {option.price && option.price > 0 && ` (+${formatPrice(option.price)})`}
                </span>
              </label>
            ))}
          </div>
        );
        
      case 'file':
      case 'file_upload':
        return (
          <div className="addon-file-upload">
            <label className="file-upload-label">
              <input
                type="file"
                onChange={(e) => handleFileUpload(fieldId, e.target.files[0])}
                accept={addon.allowed_types || '*'}
                required={addon.required}
                className="file-input"
              />
              <span className="file-upload-button">
                <Upload size={16} />
                {addonFiles[fieldId] ? addonFiles[fieldId].name : 'Seleccionar archivo'}
              </span>
            </label>
            {addon.max_size && (
              <p className="file-size-info">Tamaño máximo: {addon.max_size}MB</p>
            )}
          </div>
        );
        
      case 'date':
      case 'date_picker':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleAddonChange(fieldId, e.target.value)}
            min={addon.min_date || undefined}
            max={addon.max_date || undefined}
            className="addon-date-input"
            required={addon.required}
          />
        );
        
      case 'color':
      case 'color_picker':
        return (
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => handleAddonChange(fieldId, e.target.value)}
            className="addon-color-input"
            required={addon.required}
          />
        );
        
      case 'true_false':
        return (
          <label className="addon-checkbox-option">
            <input
              type="checkbox"
              checked={value === true || value === 'yes'}
              onChange={(e) => handleAddonChange(fieldId, e.target.checked)}
              required={addon.required}
            />
            <span className="checkbox-label">
              {addon.label || 'Sí'}
            </span>
          </label>
        );
        
      default:
        return null;
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="customization-modal-overlay" onClick={onClose}>
      <div className="customization-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>

        <h2>Personaliza tu {product.name}</h2>

        {loading ? (
          <div className="loading-container">
            <Loader className="loading-spinner" size={48} />
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
            {/* Información del producto */}
            <div className="customization-product-info">
              {product.images && product.images[0] ? (
                <img 
                  src={product.images[0].src} 
                  alt={product.name} 
                  className="customization-product-image"
                />
              ) : (
                <div className="customization-product-image placeholder">
                  <Pizza size={48} />
                </div>
              )}
              <div className="product-details">
                <h3>{product.name}</h3>
                {product.short_description && (
                  <p className="product-description" 
                     dangerouslySetInnerHTML={{ __html: product.short_description }} />
                )}
              </div>
            </div>

            {/* Atributos de variación */}
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

            {/* Advanced Product Fields */}
            {productAddons.length > 0 && (
              <div className="customization-section">
                <h4>Opciones adicionales</h4>
                {productAddons.map((addon, index) => (
                  <div key={addon.id || addon.name || index} className="addon-field">
                    <label className="addon-label">
                      {addon.title || addon.name}
                      {addon.required && <span className="required">*</span>}
                      {addon.price && addon.price > 0 && (
                        <span className="addon-price">
                          {addon.price_type === 'quantity_based' 
                            ? ` (+${formatPrice(addon.price)} por unidad)`
                            : ` (+${formatPrice(addon.price)})`
                          }
                        </span>
                      )}
                    </label>
                    {addon.description && (
                      <p className="addon-description">{addon.description}</p>
                    )}
                    {renderAddonField(addon)}
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
                ¿Alguna preferencia especial?
              </p>
              <textarea
                className="special-instructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Ej: Sin cebolla, extra queso, etc."
                maxLength={200}
              />
              <span className="char-count">
                {specialInstructions.length}/200
              </span>
            </div>

            {/* Controles de cantidad y precio */}
            <div className="customization-section quantity-controls">
              <div className="quantity-selector">
                <button 
                  className="quantity-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="quantity-value">{quantity}</span>
                <button 
                  className="quantity-btn"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={selectedVariation && selectedVariation.stock_quantity && 
                           quantity >= selectedVariation.stock_quantity}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="quantity-price">
                <span className="price-label">Precio unitario</span>
                <span className="price-value">{formatPrice(totalPrice / quantity)}</span>
              </div>
            </div>
          </>
        )}

        {/* Footer con precio total y botón de agregar */}
        <div className="customization-footer">
          <div className="total-info">
            <span className="total-label">Total</span>
            <span className="total-price">{formatPrice(totalPrice)}</span>
          </div>
          <button 
            className={`add-to-cart-btn ${addingToCart ? 'adding' : ''}`}
            onClick={handleAddToCart}
            disabled={loading || addingToCart || 
                     (selectedVariation && selectedVariation.stock_status === 'outofstock')}
          >
            {addingToCart ? (
              <>
                <Loader className="btn-spinner" size={20} />
                <span>Agregando...</span>
              </>
            ) : (
              <>
                <Check className="btn-icon" size={20} />
                <span>Agregar al carrito</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;