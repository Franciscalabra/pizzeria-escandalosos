// src/App.js
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import HomePage from './pages/HomePage/HomePage';
import MenuPage from './pages/MenuPage/MenuPage';
import CheckoutPage from './components/Checkout/CheckoutPage';
import CartSidebar from './components/Cart/CartSidebar';
import { CartProvider } from './context/CartContext';
import './App.css';

function App() {
  const [showCart, setShowCart] = useState(false);

  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Header onCartClick={() => setShowCart(true)} />
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Routes>
          </main>

          <Footer />
          
          <CartSidebar 
            isOpen={showCart} 
            onClose={() => setShowCart(false)} 
          />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;