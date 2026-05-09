'use client';

import React, { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-[400px] flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full">
            {/* Error Card */}
            <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-8 border border-[var(--color-error-container)]/50 relative overflow-hidden">
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-error-container)]/20 to-transparent" />
              
              <div className="relative">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-error-container)] flex items-center justify-center">
                  <AlertTriangle size={32} className="text-[var(--color-error)]" />
                </div>

                {/* Title */}
                <h2 className="font-headline text-2xl font-bold text-center text-[var(--color-on-surface)] mb-3">
                  Something went wrong
                </h2>

                {/* Description */}
                <p className="font-body text-sm text-center text-[var(--color-on-surface-variant)] mb-6">
                  We encountered an unexpected error. Please try again or return to the home page.
                </p>

                {/* Error Message (Development only) */}
                {process.env.NODE_ENV === 'development' && error && (
                  <div className="mb-6 p-4 rounded-lg bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)]/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Bug size={14} className="text-[var(--color-error)]" />
                      <span className="font-mono text-xs font-semibold text-[var(--color-on-surface)]">
                        Error Details
                      </span>
                    </div>
                    <p className="font-mono text-xs text-[var(--color-error)] break-words">
                      {error.message || 'Unknown error'}
                    </p>
                    {errorInfo && (
                      <details className="mt-3">
                        <summary className="font-mono text-xs text-[var(--color-on-surface-variant)] cursor-pointer hover:text-[var(--color-on-surface)]">
                          Stack trace
                        </summary>
                        <pre className="mt-2 p-3 rounded bg-[var(--color-surface-container-lowest)] overflow-x-auto font-mono text-[10px] text-[var(--color-on-surface-variant)] whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={this.handleRetry}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Try Again
                  </button>
                  <Link
                    href="/"
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <Home size={16} />
                    Go Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
