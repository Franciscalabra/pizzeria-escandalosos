// src/components/Header/Header.jsx
import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import './Header.css';

const Header = ({ onCartClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getItemCount, getCartTotal } = useContext(CartContext);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" className="logo">
            <span className="logo-text">ESCANDALOSOS</span>
            <span className="logo-tagline">Pizza Premium</span>
          </Link>

          <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Inicio
            </Link>
            <Link to="/menu" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Menú
            </Link>
            <a href="#promos" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Promociones
            </a>
            <a href="#nosotros" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Nosotros
            </a>
          </nav>

          <button 
            className="cart-btn"
            onClick={onCartClick}
            aria-label="Abrir carrito"
          >
            <ShoppingCart size={20} />
            {getItemCount() > 0 && (
              <>
                <span className="cart-count">{getItemCount()}</span>
                <span className="cart-total">{formatPrice(getCartTotal())}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;