// src/components/Header/Header.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import './Header.css';

const Header = ({ onCartClick }) => {
  const { cart } = useContext(CartContext);
  
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          ESCANDALOSOS
          <span className="logo-subtitle">Isla de Maipo</span>
        </Link>
        
        <nav className="nav">
          <Link to="/" className="nav-link">INICIO</Link>
          <Link to="/menu" className="nav-link">MENÚ</Link>
          <Link to="/promociones" className="nav-link">PROMOCIONES</Link>
          <Link to="/nosotros" className="nav-link">NOSOTROS</Link>
        </nav>
        
        <button className="cart-button" onClick={onCartClick} aria-label="Ver carrito">
          <ShoppingCart size={24} />
          {getTotalItems() > 0 && (
            <span className="cart-badge">{getTotalItems()}</span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;