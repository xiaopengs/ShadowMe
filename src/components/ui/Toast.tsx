/**
 * Toast Component - Enhanced with Accessibility
 * Features: ARIA attributes, role="alert", aria-live regions
 */
'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast item component with accessibility
function ToastItem({ 
  toast, 
  onRemove 
}: { 
  toast: Toast; 
  onRemove: (id: string) => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} />;
      case 'error':
        return <AlertCircle size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-[var(--color-secondary)]/10 border-[var(--color-secondary)]/30 text-[var(--color-secondary)]';
      case 'error':
        return 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30 text-[var(--color-error)]';
      default:
        return 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]';
    }
  };

  // Accessibility label for screen readers
  const getAriaLabel = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'Success notification';
      case 'error':
        return 'Error notification';
      default:
        return 'Information notification';
    }
  };

  // Animation variants
  const variants: Variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { 
          opacity: 0, 
          x: 100,
          scale: 0.9,
        },
        animate: { 
          opacity: 1, 
          x: 0,
          scale: 1,
          transition: {
            type: 'spring' as const,
            damping: 25,
            stiffness: 300,
          },
        },
        exit: { 
          opacity: 0, 
          x: 100,
          scale: 0.9,
          transition: {
            duration: 0.2,
            ease: [0.4, 0, 1, 1] as const,
          },
        },
      };

  return (
    <motion.div
      layout
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border
        backdrop-blur-md shadow-lg min-w-[280px] max-w-[400px]
        ${getStyles(toast.type)}
      `}
      role="alert"
      aria-live="polite"
      aria-label={getAriaLabel(toast.type)}
    >
      {/* Icon */}
      <motion.span 
        className="flex-shrink-0"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
        aria-hidden="true"
      >
        {getIcon(toast.type)}
      </motion.span>
      
      {/* Message */}
      <motion.p 
        className="flex-1 text-sm font-body text-[var(--color-on-surface)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        {toast.message}
      </motion.p>
      
      {/* Close Button */}
      <motion.button
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 rounded transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </motion.button>
    </motion.div>
  );
}

// Live region for assertive announcements (for critical errors)
function ToastLiveRegion({ message, type }: { message: string; type: ToastType }) {
  return (
    <div 
      role="alert" 
      aria-live="assertive" 
      aria-atomic="true"
      className="sr-only"
    >
      {type === 'error' ? `Error: ${message}` : message}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [assertiveMessage, setAssertiveMessage] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // For critical errors, use assertive live region
    if (type === 'error') {
      setAssertiveMessage({ message, type });
      setTimeout(() => setAssertiveMessage(null), 1000);
    }
    
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Assertive live region for critical announcements */}
      {assertiveMessage && (
        <ToastLiveRegion message={assertiveMessage.message} type={assertiveMessage.type} />
      )}
      
      {/* Toast Container with staggered animations */}
      <div 
        className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
        aria-label="Notifications"
        role="region"
      >
        <AnimatePresence mode="sync" initial={false}>
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
