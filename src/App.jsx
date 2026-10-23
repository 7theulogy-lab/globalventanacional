import { useState } from 'react';
import Dashboard from './components/Dashboard';
import VentaView from './components/VentaView';

export default function App() {
  const [currentVenta, setCurrentVenta] = useState(null);

  return (
    <div className="min-h-screen">
      {currentVenta ? (
        <VentaView venta={currentVenta} onBack={() => setCurrentVenta(null)} />
      ) : (
        <Dashboard onSelectVenta={setCurrentVenta} />
      )}
    </div>
  );
}
