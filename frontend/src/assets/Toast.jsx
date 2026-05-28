import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext({ showToast: (_msg, _type) => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            padding: '10px 14px',
            borderRadius: 8,
            color: '#111',
            background: t.type === 'error' ? '#fecaca' : t.type === 'success' ? '#bbf7d0' : '#e5e7eb',
            border: '1px solid rgba(0,0,0,0.15)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}


