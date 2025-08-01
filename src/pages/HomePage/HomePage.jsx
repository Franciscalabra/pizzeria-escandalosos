// src/pages/HomePage/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Clock, Pizza, Percent, Tag, Star } from 'lucide-react';
import { useWooCommerce } from '../../hooks/useWooCommerce';
import ProductCard from '../../components/ProductCard/ProductCard';
import ProductModal from '../../components/ProductModal/ProductModal';
import CustomizationModal from '../../components/CustomizationModal/CustomizationModal';
import './HomePage.css';

const HomePage = () => {
  const { products, categories, loading } = useWooCommerce();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

  // Actualizar productos filtrados cuando cambian los productos, categoría o búsqueda
  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchTerm]);

  const filterProducts = () => {
    let filtered = [...products];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product =>
        product.categories?.some(cat => cat.id === parseInt(selectedCategory))
      );
    }

    setFilteredProducts(filtered);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    
    // Determinar qué modal abrir basado en el tipo de producto
    const needsCustomization = 
      product.type === 'variable' || 
      product.type === 'grouped' ||
      product.attributes?.length > 0 ||
      product.categories?.some(cat => 
        ['pizzas', 'combos', 'personalizables'].includes(cat.slug)
      );

    if (needsCustomization) {
      setShowCustomizationModal(true);
      setShowProductModal(false);
    } else {
      setShowProductModal(true);
      setShowCustomizationModal(false);
    }
  };

  const handleCloseModals = () => {
    setShowProductModal(false);
    setShowCustomizationModal(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  return (
    <div className="home-page">
      {/* Barra de promociones */}
      <div className="promo-bar">
        <Tag size={16} />
        <span>¡Envío gratis en pedidos sobre $25.000!</span>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-highlight">ESCANDALOSOS</span>
            <span className="hero-subtitle">Pizza Premium</span>
          </h1>
          <p className="hero-description">
            La mejor pizza artesanal de Santiago, hecha con amor y los mejores ingredientes
          </p>
          
          {/* Barra de búsqueda */}
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar en nuestro menú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Features */}
          <div className="hero-features">
            <div className="feature">
              <Clock size={20} />
              <span>30-45 min</span>
            </div>
            <div className="feature">
              <Pizza size={20} />
              <span>Pizza artesanal</span>
            </div>
            <div className="feature">
              <Percent size={20} />
              <span>Ofertas diarias</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="categories-section">
        <div className="container">
          <div className="categories-wrapper">
            <button
              className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Todos
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id.toString() ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id.toString())}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Productos */}
      <section className="products-section">
        <div className="container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando deliciosas pizzas...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="results-info">
                <p>{filteredProducts.length} productos encontrados</p>
              </div>
              <div className="products-grid">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onCustomize={handleProductClick}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="no-results">
              <Pizza size={64} />
              <p>No se encontraron productos</p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
              >
                Ver todos los productos
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Modal de detalles del producto */}
      {selectedProduct && showProductModal && (
        <ProductModal
          product={selectedProduct}
          isOpen={showProductModal}
          onClose={handleCloseModals}
        />
      )}

      {/* Modal de personalización */}
      {selectedProduct && showCustomizationModal && (
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