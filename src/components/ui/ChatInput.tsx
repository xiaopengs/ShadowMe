/**
 * Chat Input Component
 * Design: Input with left attach button and inline send button
 * Source: detail_log_1/code.html
 */
'use client';

import React, { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function ChatInput({ onSend, placeholder = 'Reply to Claude Code...', disabled, className = '' }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex items-end gap-3 p-3 border-t border-[var(--color-outline-variant)]/30 ${className}`}>
      {/* Attach Button */}
      <button 
        className="w-10 h-10 shrink-0 rounded-full text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-variant)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center"
        disabled={disabled}
        aria-label="Attach file"
      >
        <Paperclip size={18} />
      </button>

      {/* Input Field */}
      <div className="flex-1 bg-[var(--color-surface-container)] rounded-xl border border-[var(--color-outline-variant)]/50 focus-within:border-[var(--color-primary)] transition-all overflow-hidden flex items-center pr-2 py-1 min-h-[48px] focus-within:shadow-[0_0_15px_rgba(var(--color-primary-rgb, 194,101,42),0.2)]">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent border-none focus:ring-0 text-[var(--color-on-surface)] font-body text-sm resize-none py-2 px-3 leading-normal"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button 
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="w-8 h-8 shrink-0 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-primary)]/20 disabled:hover:text-[var(--color-primary)]"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
