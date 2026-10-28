import { useEffect, useRef, useState } from 'react';

function readStoredValue(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    const value = raw === null ? fallback : JSON.parse(raw);
    if (Array.isArray(fallback) && !Array.isArray(value)) throw new Error('Formato inválido');
    return { value, error: '' };
  } catch {
    return {
      value: fallback,
      error: 'No se pudieron leer los datos guardados en este dispositivo.'
    };
  }
}

export default function useLocalStorage(key, initialValue) {
  const fallbackRef = useRef(initialValue);
  const [initial] = useState(() => readStoredValue(key, fallbackRef.current));
  const [storedValue, setStoredValue] = useState(initial.value);
  const [storageError, setStorageError] = useState(initial.error);
  const valueRef = useRef(initial.value);

  useEffect(() => {
    const handleStorage = event => {
      if (event.key !== key) return;
      const next = readStoredValue(key, fallbackRef.current);
      valueRef.current = next.value;
      setStoredValue(next.value);
      setStorageError(next.error);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  const setValue = value => {
    try {
      const nextValue = typeof value === 'function' ? value(valueRef.current) : value;
      window.localStorage.setItem(key, JSON.stringify(nextValue));
      valueRef.current = nextValue;
      setStoredValue(nextValue);
      setStorageError('');
      return true;
    } catch {
      setStorageError('No se pudo guardar el cambio. Revisa el espacio o la configuración del navegador.');
      return false;
    }
  };

  return [storedValue, setValue, storageError];
}
