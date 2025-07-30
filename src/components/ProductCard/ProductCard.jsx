// src/components/ProductCard/ProductCard.jsx
import React, { useContext, useState } from 'react';
import { Plus, Check, ShoppingBag } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  // Extract plain text from HTML description
  const getPlainDescription = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  return (
    <article className="product-card">
      <div className="product-image-container">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].src}
            alt={product.name}
            className="product-image"
            loading="lazy"
          />
        ) : (
          <div className="product-image-placeholder">
            <ShoppingBag size={48} />
          </div>
        )}
        {product.on_sale && (
          <span className="product-badge">Oferta</span>
        )}
      </div>
      
      <div className="product-content">
        <h3 className="product-title">{product.name}</h3>
        
        <p className="product-description">
          {getPlainDescription(product.short_description || product.description || 'Pizza artesanal con ingredientes premium')}
        </p>
        
        <div className="product-footer">
          <div className="product-price">
            {product.on_sale && product.regular_price && (
              <span className="price-regular">{formatPrice(product.regular_price)}</span>
            )}
            <span className="price-current">{formatPrice(product.price)}</span>
          </div>
          
          <button 
            className={`add-to-cart-btn ${isAdded ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={isAdded}
          >
            {isAdded ? (
              <>
                <Check size={20} />
                <span>Agregado</span>
              </>
            ) : (
              <>
                <Plus size={20} />
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;