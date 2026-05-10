/**
 * ConfirmDialog Component - Enhanced with Accessibility
 * Features: Focus trap, ARIA attributes, keyboard navigation
 */
'use client';

import { useState, useCallback, createContext, useContext, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useFocusTrap } from '@/lib/hooks';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap with cancel button as initial focus
  const focusTrapRef = useFocusTrap({
    isActive: isOpen,
    onEscape: onCancel,
    initialFocusRef: cancelButtonRef,
  });

  // Handle keyboard for dialog
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [onCancel]);

  // Merge refs
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    (focusTrapRef as any).current = node;
  }, [focusTrapRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onCancel}
            aria-hidden="true"
          />
          
          {/* Dialog */}
          <motion.div
            ref={setRefs}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-heavy z-50 rounded-2xl p-6"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-start gap-4">
              {variant === 'danger' && (
                <div className="p-3 rounded-full bg-[var(--color-error)]/10" role="img" aria-label="Warning icon">
                  <AlertTriangle size={24} className="text-[var(--color-error)]" />
                </div>
              )}
              <div className="flex-1">
                <h3 id="confirm-dialog-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {title}
                </h3>
                <p id="confirm-dialog-message" className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  {message}
                </p>
              </div>
              <button
                onClick={onCancel}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close dialog"
              >
                <X size={18} className="text-[var(--color-text-muted)]" />
              </button>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                ref={cancelButtonRef}
                onClick={onCancel}
                className="flex-1 btn-secondary"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 ${variant === 'danger' ? 'bg-[var(--color-error)] hover:bg-[var(--color-error)]/90' : 'btn-primary'}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ConfirmDialogState {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  resolve: (confirmed: boolean) => void;
}

interface ConfirmDialogContextType {
  showConfirm: (options: Omit<ConfirmDialogState, 'resolve'>) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ConfirmDialogState | null>(null);

  const showConfirm = useCallback((options: Omit<ConfirmDialogState, 'resolve'>) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ ...options, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    dialog?.resolve(true);
    setDialog(null);
  }, [dialog]);

  const handleCancel = useCallback(() => {
    dialog?.resolve(false);
    setDialog(null);
  }, [dialog]);

  return (
    <ConfirmDialogContext.Provider value={{ showConfirm }}>
      {children}
      {dialog && (
        <ConfirmDialog
          isOpen={true}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          variant={dialog.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return context;
}
