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
            padding: '14px 20px',
            borderRadius: 0,
            color: t.type === 'error' ? '#ffffff' : '#0f172a',
            background: t.type === 'error' ? '#000000' : '#ffffff',
            border: '2px solid #000000',
            boxShadow: 'none',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 900,
            textTransform: 'uppercase',
            fontSize: '0.85rem',
            letterSpacing: '1px'
          }}>
            <span style={{ marginRight: '8px', opacity: 0.8 }}>
              {t.type === 'error' ? 'ERROR :' : t.type === 'success' ? 'SUCCESS :' : 'INFO :'}
            </span>
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


