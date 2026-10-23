import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import VentaView from './components/VentaView';

export default function App() {
  const [currentVenta, setCurrentVenta] = useState(null);

  // Escuchar el botón físico "Atrás" del dispositivo PDA/Android
  useEffect(() => {
    const handlePopState = (e) => {
      // Si el historial nos lleva a un estado nulo, significa que debemos volver al Dashboard
      if (!e.state || !e.state.screen) {
        setCurrentVenta(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectVenta = (venta) => {
    // Cuando entramos a una venta, agregamos un paso al historial del navegador (pda)
    window.history.pushState({ screen: 'venta' }, '');
    setCurrentVenta(venta);
  };

  const handleBackToDashboard = () => {
    // Si apretamos la flecha virtual, forzamos el botón atrás del navegador 
    // para mantener limpio el historial
    if (window.history.state?.screen === 'venta') {
      window.history.back(); // Esto dispara popstate y cierra la vista
    } else {
      setCurrentVenta(null);
    }
  };

  return (
    <div className="min-h-screen">
      {currentVenta ? (
        <VentaView venta={currentVenta} onBack={handleBackToDashboard} />
      ) : (
        <Dashboard onSelectVenta={handleSelectVenta} />
      )}
    </div>
  );
}
