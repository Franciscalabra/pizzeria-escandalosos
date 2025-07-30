// src/pages/MenuPage/MenuPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import ProductCard from '../../components/ProductCard/ProductCard';
import { useWooCommerce } from '../../hooks/useWooCommerce';
import './MenuPage.css';

const MenuPage = () => {
  const { products, categories, loading, error } = useWooCommerce();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesCategory = selectedCategory === 'all' || 
        product.categories.some(cat => cat.id === parseInt(selectedCategory));
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch(sortBy) {
        case 'price-low':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price-high':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando menú...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Error al cargar el menú</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="menu-page">
      {/* Hero Banner */}
      <section className="menu-hero">
        <div className="container">
          <h1 className="menu-hero-title">Nuestro Menú</h1>
          <p className="menu-hero-subtitle">
            Pizzas artesanales hechas con los mejores ingredientes
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="menu-filters">
        <div className="container">
          <div className="filters-wrapper">
            {/* Search */}
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar pizza..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <Filter size={20} />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="filter-group">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="name">Ordenar por nombre</option>
                <option value="price-low">Precio: menor a mayor</option>
                <option value="price-high">Precio: mayor a menor</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <p className="results-count">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="menu-products section">
        <div className="container">
          {filteredProducts.length === 0 ? (
            <div className="no-results">
              <p>No se encontraron productos</p>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MenuPage;