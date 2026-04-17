import React from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export function LoadingSpinner({ text = 'Memuat...', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 border-4 border-indigo-500/20 rounded-full" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
      </div>
      <p className="text-slate-400 text-sm">{text}</p>
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Terjadi kesalahan saat memuat data',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-slate-300 font-medium">Gagal Memuat Data</p>
        <p className="text-slate-500 text-sm mt-1">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      {icon && (
        <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
          {icon}
        </div>
      )}
      <div className="text-center">
        <p className="text-slate-300 font-medium">{title}</p>
        <p className="text-slate-500 text-sm mt-1">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-slate-800/50 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}
