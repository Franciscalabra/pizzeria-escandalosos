// src/context/CartContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Inicializar carrito desde localStorage
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('pizza_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Estado para notificaciones
  const [notification, setNotification] = useState(null);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('pizza_cart', JSON.stringify(cart));
  }, [cart]);

  // Función para mostrar notificaciones
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Agregar al carrito
  const addToCart = useCallback((item) => {
    setCart(prevCart => {
      // Crear un ID único para el item basado en sus atributos
      const itemId = item.id || `${item.productId}-${Date.now()}`;
      
      // Para productos personalizables, siempre agregar como nuevo item
      if (item.customizations && Object.keys(item.customizations).length > 0) {
        const newItem = {
          ...item,
          id: itemId,
          addedAt: new Date().toISOString()
        };
        showNotification(`${item.name} agregado al carrito`, 'success');
        return [...prevCart, newItem];
      }
      
      // Para productos simples, buscar si ya existe
      const existingItemIndex = prevCart.findIndex(
        cartItem => cartItem.productId === item.productId && 
                   (!cartItem.customizations || Object.keys(cartItem.customizations).length === 0)
      );
      
      if (existingItemIndex > -1) {
        // Si existe, aumentar cantidad
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + (item.quantity || 1)
        };
        showNotification(`${item.name} actualizado en el carrito`, 'success');
        return updatedCart;
      }
      
      // Si no existe, agregar nuevo
      const newItem = {
        ...item,
        id: itemId,
        quantity: item.quantity || 1,
        addedAt: new Date().toISOString()
      };
      showNotification(`${item.name} agregado al carrito`, 'success');
      return [...prevCart, newItem];
    });
  }, []);

  // Remover del carrito
  const removeFromCart = useCallback((itemId) => {
    setCart(prevCart => {
      const item = prevCart.find(item => item.id === itemId);
      if (item) {
        showNotification(`${item.name} eliminado del carrito`, 'info');
      }
      return prevCart.filter(item => item.id !== itemId);
    });
  }, []);

  // Actualizar cantidad
  const updateQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }, [removeFromCart]);

  // Limpiar carrito
  const clearCart = useCallback(() => {
    setCart([]);
    showNotification('Carrito vaciado', 'info');
  }, []);

  // Obtener total del carrito
  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQuantity = parseInt(item.quantity) || 1;
      return total + (itemPrice * itemQuantity);
    }, 0);
  }, [cart]);

  // Obtener cantidad de items
  const getItemCount = useCallback(() => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  }, [cart]);

  // Obtener un item específico
  const getCartItem = useCallback((itemId) => {
    return cart.find(item => item.id === itemId);
  }, [cart]);

  // Verificar si un producto está en el carrito
  const isInCart = useCallback((productId) => {
    return cart.some(item => item.productId === productId);
  }, [cart]);

  // Obtener descripción de personalizaciones
  const getCustomizationDescription = (customizations) => {
    if (!customizations || Object.keys(customizations).length === 0) {
      return '';
    }
    
    const parts = [];
    
    if (customizations.attributes) {
      Object.entries(customizations.attributes).forEach(([key, value]) => {
        parts.push(`${key}: ${value}`);
      });
    }
    
    if (customizations.specialInstructions) {
      parts.push(`Nota: ${customizations.specialInstructions}`);
    }
    
    return parts.join(' | ');
  };

  const value = {
    cart,
    notification,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
    getCartItem,
    isInCart,
    getCustomizationDescription
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {/* Notificación Global */}
      {notification && (
        <div className={`cart-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </CartContext.Provider>
  );
};