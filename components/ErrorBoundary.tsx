// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ErrorBoundary${this.props.name ? ` (${this.props.name})` : ''}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
          return this.props.fallback;
      }
      return (
        <div className="p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[20px] text-center">
            <div className="mb-3 bg-red-100 dark:bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                <span className="material-icons-round text-red-500">error_outline</span>
            </div>
            <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">Terjadi Kesalahan</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mb-4 px-4">
                Komponen {this.props.name || 'ini'} mengalami masalah dan tidak dapat ditampilkan.
            </p>
            <div className="max-h-32 overflow-y-auto text-left bg-white dark:bg-black/20 p-3 rounded-lg border border-red-100 dark:border-white/5 mx-auto max-w-md">
                <p className="font-mono text-[10px] text-red-500">{this.state.error?.message}</p>
            </div>
            <button 
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-4 px-4 py-2 bg-white dark:bg-red-500/20 border border-red-200 dark:border-red-500/20 rounded-xl text-xs font-bold text-red-600 dark:text-white hover:bg-red-50 transition-colors"
            >
                Coba Muat Ulang
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
