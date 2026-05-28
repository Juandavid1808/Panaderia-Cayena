import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen_url: string;
  stock: number; // <-- AGREGADO: Tipamos el stock para controlarlo en todo el flujo
}

interface CartContextType {
  cart: CartItem[]; 
  addToCart: (item: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, cantidad: number, stockMaximo: number) => void; // <-- MODIFICADO: Recibe el stock de control
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cayena_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cayena_cart', JSON.stringify(cart));
  }, [cart]);

  // CONTROL DE STOCK AL AGREGAR DESDE EL CATÁLOGO
  const addToCart = (newItem: any) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === newItem.id);
      const stockDisponible = newItem.stock ?? 0;

      if (exists) {
        // Validamos si la cantidad actual + lo que quiere meter supera el stock real
        const nuevaCantidad = exists.cantidad + (newItem.cantidad || 1);
        if (nuevaCantidad > stockDisponible) {
          alert(`¡Uy! No hay suficientes existencias de ${newItem.nombre || 'este producto'}. Solamente quedan ${stockDisponible} unidades disponibles.`);
          return prev;
        }
        return prev.map(item =>
          item.id === newItem.id ? { ...item, cantidad: nuevaCantidad } : item
        );
      }

      // Validamos si es un producto nuevo pero ya no hay stock físico
      if (stockDisponible <= 0) {
        alert(`Lo sentimos, ${newItem.nombre || 'este producto'} se encuentra temporalmente agotado.`);
        return prev;
      }

      // Mapeamos el nuevo elemento asegurándonos de pasarle su stock e inicialmente 1 unidad si no viene definida
      return [...prev, {
        id: newItem.id,
        nombre: newItem.nombre,
        precio: newItem.precio,
        cantidad: newItem.cantidad || 1,
        imagen_url: newItem.imagen_url || '',
        stock: stockDisponible
      }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  
  // CONTROL DE STOCK AL MODIFICAR DIRECTAMENTE EN EL CARRITO
  const updateQuantity = (id: string, cantidad: number, stockMaximo: number) => {
    if (cantidad > stockMaximo) {
      alert(`Llegaste al límite disponible. Solo contamos con ${stockMaximo} unidades.`);
      return;
    }
    if (cantidad <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.id === id ? { ...item, cantidad } : item))
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      totalItems, 
      totalPrice 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider');
  return context;
};