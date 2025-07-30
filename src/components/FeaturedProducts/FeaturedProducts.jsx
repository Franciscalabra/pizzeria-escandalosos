// src/components/FeaturedProducts/FeaturedProducts.jsx
import React from 'react';
import ProductCard from '../ProductCard/ProductCard';
import { useWooCommerce } from '../../hooks/useWooCommerce';
import './FeaturedProducts.css';

const FeaturedProducts = () => {
  const { products, loading } = useWooCommerce();
  
  // Get only featured or first 4 products
  const featuredProducts = products
    .filter(product => product.featured || product.on_sale)
    .slice(0, 4);
  
  // If no featured products, get first 4
  const displayProducts = featuredProducts.length > 0 
    ? featuredProducts 
    : products.slice(0, 4);

  if (loading) {
    return (
      <div className="featured-products-loading">
        <div className="product-skeleton"></div>
        <div className="product-skeleton"></div>
        <div className="product-skeleton"></div>
        <div className="product-skeleton"></div>
      </div>
    );
  }

  return (
    <div className="featured-products">
      <div className="featured-products-grid">
        {displayProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default FeaturedProducts;