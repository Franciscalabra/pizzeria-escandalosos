// src/pages/HomePage/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Tag } from 'lucide-react';
import { useWooCommerce } from '../../hooks/useWooCommerce';
import './HomePage.css';

const HomePage = () => {
  const { products, categories, loading } = useWooCommerce();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // Lazy loading de componentes para evitar importación circular
  const [ProductCard, setProductCard] = useState(null);
  const [ProductModal, setProductModal] = useState(null);
  const [CustomizationModal, setCustomizationModal] = useState(null);

  useEffect(() => {
    // Cargar componentes de forma asíncrona
    import('../../components/ProductCard/ProductCard').then(module => {
      setProductCard(() => module.default);
    });
    import('../../components/ProductModal/ProductModal').then(module => {
      setProductModal(() => module.default);
    });
    import('../../components/CustomizationModal/CustomizationModal').then(module => {
      setCustomizationModal(() => module.default);
    });
  }, []);

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
        // Filtrar productos en promoción
        filtered = filtered.filter(product => 
          product.on_sale || product.categories.some(cat => cat.slug === 'promociones')
        );
      } else if (selectedCategory === 'combos') {
        // Filtrar combos
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

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    
    // Si el producto tiene variaciones o es un combo, abrir modal de personalización
    if (product.variations?.length > 0 || product.type === 'grouped' || product.categories.some(cat => cat.slug === 'combos')) {
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
    <div className="homepage">
      {/* Barra de Promociones */}
      <div className="promo-bar">
        <Tag size={20} />
        <span>¡PROMOS ESPECIALES TODA LA SEMANA!</span>
      </div>

      {/* Sección de Búsqueda y Filtros */}
      <section className="search-section">
        <div className="container">
          <h1 className="homepage-title">¿Qué se te antoja hoy?</h1>
          
          {/* Barra de búsqueda */}
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar pizzas, combos, bebidas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Categorías */}
          <div className="categories-container">
            <button
              className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Todos
            </button>
            
            <button
              className={`category-btn promo-category ${selectedCategory === 'promos' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('promos')}
            >
              <Tag size={16} />
              PROMOS
            </button>
            
            <button
              className={`category-btn ${selectedCategory === 'combos' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('combos')}
            >
              Combos
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

      {/* Grid de Productos */}
      <section className="products-section">
        <div className="container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando deliciosas opciones...</p>
            </div>
          ) : (
            <>
              <div className="results-info">
                <p>{filteredProducts.length} productos encontrados</p>
              </div>
              
              <div className="products-grid">
                {ProductCard && filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="no-results">
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
            </>
          )}
        </div>
      </section>

      {/* Modals */}
      {showProductModal && selectedProduct && ProductModal && (
        <ProductModal
          product={selectedProduct}
          isOpen={showProductModal}
          onClose={handleCloseModals}
        />
      )}

      {showCustomizationModal && selectedProduct && CustomizationModal && (
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