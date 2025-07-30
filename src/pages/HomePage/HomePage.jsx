// src/pages/HomePage/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Tag } from 'lucide-react';
import { useWooCommerce } from '../../hooks/useWooCommerce';
import ProductCard from '../../components/ProductCard/ProductCard';
import ProductModal from '../../components/ProductModal/ProductModal';
import CustomizationModal from '../../components/CustomizationModal/CustomizationModal';
import './HomePage.css';

const HomePage = () => {
  const { products, categories, loading } = useWooCommerce();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const filterProducts = () => {
    let filtered = [...products];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'promos') {
        filtered = filtered.filter(product => 
          product.on_sale || product.categories.some(cat => cat.slug === 'promociones')
        );
      } else if (selectedCategory === 'combos') {
        filtered = filtered.filter(product => 
          product.categories.some(cat => cat.slug === 'combos')
        );
      } else {
        filtered = filtered.filter(product =>
          product.categories.some(cat => cat.id === parseInt(selectedCategory))
        );
      }
    }

    setFilteredProducts(filtered);
  };

  const handleProductCustomize = (product) => {
    setSelectedProduct(product);
    
    // Determinar qué modal abrir basado en el tipo de producto
    if (product.type === 'variable' || 
        product.type === 'grouped' ||
        product.attributes?.length > 0 ||
        product.categories?.some(cat => ['pizzas', 'combos', 'personalizables'].includes(cat.slug))) {
      setShowCustomizationModal(true);
    } else {
      setShowProductModal(true);
    }
  };

  const handleCloseModals = () => {
    setShowProductModal(false);
    setShowCustomizationModal(false);
    setSelectedProduct(null);
  };

  return (
    <div className="home-page">
      {/* Header de búsqueda */}
      <div className="search-section">
        <div className="search-bar">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Categorías */}
      <div className="categories-section">
        <button
          className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          Todos
        </button>
        <button
          className={`category-chip ${selectedCategory === 'promos' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('promos')}
        >
          <Tag size={16} />
          Promociones
        </button>
        <button
          className={`category-chip ${selectedCategory === 'combos' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('combos')}
        >
          Combos
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-chip ${selectedCategory === category.id.toString() ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id.toString())}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando productos...</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onCustomize={handleProductCustomize}
              />
            ))
          ) : (
            <div className="no-products">
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de detalles del producto */}
      {showProductModal && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={showProductModal}
          onClose={handleCloseModals}
        />
      )}

      {/* Modal de personalización */}
      {showCustomizationModal && selectedProduct && (
        <CustomizationModal
          product={selectedProduct}
          isOpen={showCustomizationModal}
          onClose={handleCloseModals}
        />
      )}
    </div>
  );
};

export default HomePage;