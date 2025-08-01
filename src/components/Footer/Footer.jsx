// src/components/Footer/Footer.jsx
import React from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Brand Column */}
            <div className="footer-column">
              <h3 className="footer-brand">ESCANDALOSOS</h3>
              <p className="footer-tagline">Pizza Premium</p>
              <p className="footer-description">
                Dark kitchen Isla de maipo
              </p>
              <div className="social-links">
                <a href="#" aria-label="Facebook" className="social-link">
                  <Facebook size={20} />
                </a>
                <a href="#" aria-label="Instagram" className="social-link">
                  <Instagram size={20} />
                </a>
                <a href="#" aria-label="Twitter" className="social-link">
                  <Twitter size={20} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-column">
              <h4 className="footer-title">Enlaces Rápidos</h4>
              <ul className="footer-links">
                <li><a href="/menu">Menú</a></li>
                <li><a href="#promos">Promociones</a></li>
                <li><a href="#nosotros">Nosotros</a></li>
                <li><a href="#contacto">Contacto</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="footer-column">
              <h4 className="footer-title">Contacto</h4>
              <div className="contact-info">
                <div className="contact-item">
                  <MapPin size={18} />
                  <span>Camino las parcelas 12, isla de maipo</span>
                </div>
                <div className="contact-item">
                  <Phone size={18} />
                  <span>+56 942740261</span>
                </div>
                <div className="contact-item">
                  <Mail size={18} />
                  <span>hola@escandalosospizza.cl</span>
                </div>
                <div className="contact-item">
                  <Clock size={18} />
                  <span>Lunes a jueves: 18:00 - 22:00 hrs</span>
                    <span>Viernes: 18:00 - 23:00 hrs</span>
                    <span>Sábado: 13:00 - 23:00 hrs</span>
                    <span>Domingo: 13:00 - 22:00 hrs</span>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div className="footer-column">
              <h4 className="footer-title">Newsletter</h4>
              <p className="footer-text">
                Suscríbete para recibir ofertas exclusivas y novedades
              </p>
              <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Tu email" 
                  className="newsletter-input"
                  required
                />
                <button type="submit" className="newsletter-btn">
                  Suscribir
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p className="copyright">
            © {currentYear} Escandalosos Pizza. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;