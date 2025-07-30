// src/components/ProductCard/ProductCard.jsx
import React, { useContext } from 'react';
import { ShoppingCart, Tag } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product, onCustomize }) => {
  const { addToCart } = useContext(CartContext);
  
  // Verificar si el producto necesita personalización
  const needsCustomization = () => {
    // Producto variable (con variaciones)
    if (product.type === 'variable') return true;
    
    // Producto agrupado
    if (product.type === 'grouped') return true;
    
    // Categorías que requieren personalización
    const customizableCategories = ['pizzas', 'combos', 'personalizables'];
    if (product.categories?.some(cat => 
      customizableCategories.includes(cat.slug)
    )) return true;
    
    // Productos con atributos
    if (product.attributes?.length > 0) return true;
    
    return false;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    
    if (needsCustomization()) {
      // Si necesita personalización y hay un manejador, usarlo
      if (onCustomize && typeof onCustomize === 'function') {
        onCustomize(product);
      } else {
        // Si no hay manejador, mostrar alerta
        alert('Este producto requiere personalización. Por favor, selecciona las opciones desde el menú.');
      }
    } else {
      // Producto simple, agregar directamente
      addToCart({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.images?.[0]?.src || '',
        quantity: 1
      });
    }
  };

  const handleCardClick = () => {
    // Al hacer clic en la tarjeta, mostrar detalles o personalización
    if (onCustomize && typeof onCustomize === 'function') {
      onCustomize(product);
    }
  };

  // Para productos variables, mostrar rango de precios
  const getPriceDisplay = () => {
    if (product.type === 'variable' && product.price_range) {
      return (
        <span className="product-price-range">
          {formatPrice(product.price_range.min_price)} - {formatPrice(product.price_range.max_price)}
        </span>
      );
    }
    
    return (
      <>
        {product.on_sale && product.regular_price && (
          <span className="product-price-regular">{formatPrice(product.regular_price)}</span>
        )}
        <span className="product-price-sale">{formatPrice(product.price)}</span>
      </>
    );
  };

  return (
    <div className="product-card" onClick={handleCardClick}>
      {product.on_sale && (
        <div className="product-badge">
          <Tag size={16} />
          PROMO
        </div>
      )}
      
      <div className="product-image-container">
        {product.images?.[0]?.src ? (
          <img 
            src={product.images[0].src} 
            alt={product.name}
            className="product-image"
            loading="lazy"
          />
        ) : (
          <div className="product-image-placeholder">
            <ShoppingCart size={48} />
          </div>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        
        {product.short_description && (
          <p className="product-description" 
             dangerouslySetInnerHTML={{ __html: product.short_description }} 
          />
        )}
        
        {/* Mostrar atributos disponibles para productos variables */}
        {product.attributes?.length > 0 && (
          <div className="product-attributes">
            {product.attributes.map(attr => (
              <span key={attr.id} className="attribute-badge">
                {attr.options.length} {attr.name}
              </span>
            ))}
          </div>
        )}
        
        <div className="product-footer">
          <div className="product-price">
            {getPriceDisplay()}
          </div>
          
          <button 
            className="product-btn"
            onClick={handleButtonClick}
            aria-label={needsCustomization() ? 'Personalizar producto' : 'Agregar al carrito'}
          >
            {needsCustomization() ? 'Personalizar' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;