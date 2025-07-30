// src/components/ProductCard/ProductCard.jsx
import React, { useContext } from 'react';
import { ShoppingCart, Tag } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product, onClick }) => {
  const { addToCart } = useContext(CartContext);
  
  // Verificar si el producto necesita personalización
  const needsCustomization = product.variations?.length > 0 || 
                           product.type === 'grouped' || 
                           product.categories.some(cat => cat.slug === 'combos');

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
    
    if (needsCustomization) {
      onClick();
    } else {
      // Agregar directamente al carrito
      addToCart({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.images?.[0]?.src || null,
        quantity: 1
      });
    }
  };

  return (
    <div className="product-card" onClick={onClick}>
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
        
        <div className="product-footer">
          <div className="product-price">
            {product.on_sale && product.regular_price && (
              <span className="product-price-regular">{formatPrice(product.regular_price)}</span>
            )}
            <span className="product-price-sale">{formatPrice(product.price)}</span>
          </div>
          
          <button 
            className="product-btn"
            onClick={handleButtonClick}
          >
            {needsCustomization ? 'Personalizar' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;