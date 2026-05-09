/**
 * UI Components Index
 * Design System aligned components for ShadowMe
 */

// Terminal-style communication components
export { default as CCTerminalBlock } from './CCTerminalBlock';
export { default as SystemDivider } from './SystemDivider';
export { default as MessageBubble } from './MessageBubble';
export { default as ChatInput } from './ChatInput';
export { default as CCSyncLog } from './CCSyncLog';

// System status components
export { default as SystemStatusCard } from './SystemStatusCard';
export { default as WorkloadCard, type WorkloadTask } from './WorkloadCard';

// Layout components
export { default as GlassHeader } from './GlassHeader';

// Common UI components
export { ConfirmDialog } from './ConfirmDialog';
export { default as Toast, useToast } from './Toast';
export { default as ErrorBoundary } from './ErrorBoundary';
export { DashboardSkeleton } from './Skeletons';
