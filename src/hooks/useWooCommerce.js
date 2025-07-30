// src/hooks/useWooCommerce.js
import { useState, useEffect, useCallback } from 'react';
import woocommerceApi from '../services/woocommerceApi';

export const useWooCommerce = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar productos
  const loadProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await woocommerceApi.getProducts(params);
      setProducts(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error cargando productos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar categorías
  const loadCategories = useCallback(async () => {
    try {
      const data = await woocommerceApi.getCategories();
      setCategories(data);
      return data;
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  }, []);

  // Crear pedido
  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const order = await woocommerceApi.createOrder(orderData);
      return order;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  return {
    products,
    categories,
    loading,
    error,
    loadProducts,
    loadCategories,
    createOrder,
    // Exportar la API completa para uso directo si es necesario
    api: woocommerceApi
  };
};

// Hook para un producto específico
export const useProduct = (productId) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await woocommerceApi.getProduct(productId);
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  return { product, loading, error };
};

// Hook para gestionar el carrito con WooCommerce
export const useWooCommerceCart = () => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('woo_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Guardar carrito en localStorage
  useEffect(() => {
    localStorage.setItem('woo_cart', JSON.stringify(cart));
  }, [cart]);

  // Agregar al carrito
  const addToCart = useCallback((product, quantity = 1, customizations = {}) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.id === product.id && 
        JSON.stringify(item.customizations) === JSON.stringify(customizations)
      );

      if (existingItem) {
        return prevCart.map(item =>
          item === existingItem
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevCart, {
        id: product.id,
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.images[0]?.src || '',
        quantity,
        customizations
      }];
    });
  }, []);

  // Remover del carrito
  const removeFromCart = useCallback((itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  }, []);

  // Actualizar cantidad
  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  // Limpiar carrito
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Calcular total
  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  // Obtener cantidad de items
  const getItemCount = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount
  };
};