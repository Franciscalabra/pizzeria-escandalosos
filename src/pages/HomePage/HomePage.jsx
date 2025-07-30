// src/pages/HomePage/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Pizza, Clock, Truck, Star } from 'lucide-react';
import FeaturedProducts from '../../components/FeaturedProducts/FeaturedProducts';
import './HomePage.css';

const HomePage = () => {
  const features = [
    {
      icon: <Pizza size={48} />,
      title: 'Ingredientes Premium',
      description: 'Solo usamos los mejores ingredientes importados y locales'
    },
    {
      icon: <Clock size={48} />,
      title: 'Preparación Rápida',
      description: 'Tu pizza lista en 20 minutos o menos'
    },
    {
      icon: <Truck size={48} />,
      title: 'Delivery Express',
      description: 'Entrega gratis en pedidos sobre $15.000'
    },
    {
      icon: <Star size={48} />,
      title: 'Satisfacción Garantizada',
      description: '100% de satisfacción o te devolvemos tu dinero'
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Pizza Artesanal
            <span className="hero-highlight">Hecha con Amor</span>
          </h1>
          <p className="hero-subtitle">
            Descubre el auténtico sabor italiano en cada mordida. 
            Masa madre, ingredientes frescos y la pasión de siempre.
          </p>
          <div className="hero-actions">
            <Link to="/menu" className="btn btn-primary btn-icon">
              Ver Menú <ArrowRight size={20} />
            </Link>
            <a href="#promos" className="btn btn-secondary">
              Ofertas del Día
            </a>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-image-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800" 
              alt="Pizza Artesanal"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section section">
        <div className="container">
          <h2 className="section-title">¿Por qué Escandalosos?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section section">
        <div className="container">
          <h2 className="section-title">Nuestras Favoritas</h2>
          <FeaturedProducts />
          <div className="text-center mt-4">
            <Link to="/menu" className="btn btn-primary">
              Ver Todo el Menú
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">¿Antojo de Pizza?</h2>
            <p className="cta-subtitle">
              Ordena ahora y recibe 10% de descuento en tu primera compra
            </p>
            <Link to="/menu" className="btn btn-primary btn-icon">
              Ordenar Ahora <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;