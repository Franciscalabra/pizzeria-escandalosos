// src/components/ProductCard/ProductCard.jsx
import React, { useContext, useEffect, useState } from 'react';
import { ShoppingCart, Tag, Flame, Star } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import escandalososApi from '../../services/escandalososApi';
import './ProductCard.css';

const ProductCard = ({ product, onCustomize }) => {
  const { addToCart } = useContext(CartContext);
  const [isCombo, setIsCombo] = useState(false);
  
  // Verificar si el producto es combo usando la API de Escandalosos
  useEffect(() => {
    const checkIfCombo = async () => {
      try {
        const isProductCombo = await escandalososApi.isCombo(product.id);
        setIsCombo(isProductCombo);
      } catch (error) {
        console.error('Error verificando si es combo:', error);
      }
    };
    
    checkIfCombo();
  }, [product.id]);
  
  // Verificar si el producto necesita personalización
  const needsCustomization = () => {
    // Si es combo según el plugin Escandalosos
    if (isCombo) return true;
    
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
      }
    } else {
      // Producto simple, agregar directamente con animación
      const button = e.currentTarget;
      button.classList.add('adding');
      
      addToCart({
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.images?.[0]?.src || '',
        quantity: 1
      });
      
      setTimeout(() => {
        button.classList.remove('adding');
      }, 1000);
    }
  };

  // Para productos variables, mostrar rango de precios
  const getPriceDisplay = () => {
    // Para productos variables, mostrar el precio más alto (Familiar)
    if (product.type === 'variable') {
      // Primero intentar usar price_range si está disponible
      if (product.price_range && product.price_range.max_price) {
        return (
          <div className="price-single">
            <span className="product-price-sale">{formatPrice(product.price_range.max_price)}</span>
          </div>
        );
      }
      
      // Si hay display_price (precio calculado), usarlo
      if (product.display_price) {
        return (
          <div className="price-single">
            <span className="product-price-sale">{formatPrice(product.display_price)}</span>
          </div>
        );
      }
      
      // Intentar extraer el precio máximo del price_html
      if (product.price_html) {
        // El price_html contiene algo como: "$10.990 - $14.990"
        // Vamos a extraer el precio más alto
        const priceMatch = product.price_html.match(/\$[\d.]+/g);
        if (priceMatch && priceMatch.length > 1) {
          // Tomar el último precio (el más alto)
          const maxPriceStr = priceMatch[priceMatch.length - 1].replace('$', '').replace('.', '');
          const maxPrice = parseInt(maxPriceStr);
          return (
            <div className="price-single">
              <span className="product-price-sale">{formatPrice(maxPrice)}</span>
            </div>
          );
        }
      }
      
      // Si no podemos obtener el precio máximo, mostrar el precio base
      return (
        <div className="price-single">
          <span className="product-price-sale">{formatPrice(product.price)}</span>
        </div>
      );
    }
    
    // Para productos simples
    return (
      <div className="price-single">
        {product.on_sale && product.regular_price && (
          <span className="product-price-regular">{formatPrice(product.regular_price)}</span>
        )}
        <span className="product-price-sale">{formatPrice(product.price)}</span>
      </div>
    );
  };

  // Obtener badges del producto
  const getBadges = () => {
    const badges = [];
    
    if (product.on_sale) {
      const discount = product.regular_price 
        ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100)
        : 0;
      badges.push(
        <div key="sale" className="product-badge sale">
          <Tag size={14} />
          {discount > 0 ? `-${discount}%` : 'OFERTA'}
        </div>
      );
    }
    
    if (product.featured) {
      badges.push(
        <div key="featured" className="product-badge featured">
          <Star size={14} />
          DESTACADO
        </div>
      );
    }
    
    if (product.categories?.some(cat => cat.slug === 'nuevo')) {
      badges.push(
        <div key="new" className="product-badge new">
          <Flame size={14} />
          NUEVO
        </div>
      );
    }
    
    // Badge para combo
    if (isCombo) {
      badges.push(
        <div key="combo" className="product-badge combo">
          COMBO
        </div>
      );
    }
    
    return badges;
  };

  return (
    <div className="product-card">
      <div className="product-badges">
        {getBadges()}
      </div>
      
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
        {needsCustomization() && (
          <div className="customizable-badge">
            {isCombo ? 'Combo Personalizable' : 'Personalizable'}
          </div>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        
        {product.description && (
          <p className="product-description" 
             dangerouslySetInnerHTML={{ __html: product.description }} 
          />
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
            <span className="btn-text">
              {needsCustomization() ? 'Personalizar' : 'Agregar'}
            </span>
            <span className="btn-icon">
              {needsCustomization() ? '+' : <ShoppingCart size={18} />}
            </span>
            <span className="btn-success">✓</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;