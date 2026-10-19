import React, { Component, ErrorInfo, ReactNode } from 'react';
import { CircleAlert, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ToneIcon } from '@/components/data/ToneIcon';

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
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `Uncaught error in ErrorBoundary${this.props.name ? ` (${this.props.name})` : ''}:`,
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <ToneIcon icon={CircleAlert} tone="bad" size="xl" />
          <div>
            <h3 className="text-panel font-bold">Terjadi kesalahan</h3>
            <p className="mt-1 text-meta text-muted-foreground">
              Halaman {this.props.name || 'ini'} mengalami masalah dan tidak dapat ditampilkan.
            </p>
          </div>
          {this.state.error?.message && (
            <pre className="max-h-32 w-full max-w-md overflow-y-auto whitespace-pre-wrap rounded-lg border bg-surface-2 p-3 text-left font-mono text-2xs text-bad">
              {this.state.error.message}
            </pre>
          )}
          <Button variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>
            <RotateCcw aria-hidden />
            Coba muat ulang
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
