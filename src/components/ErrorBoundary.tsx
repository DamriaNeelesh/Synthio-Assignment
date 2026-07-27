import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { BrandMark } from './BrandMark';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Synthex app error', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="fatal-error">
        <div className="fatal-error__card">
          <BrandMark height={42} title="Synthex" width={42} />
          <AlertTriangle aria-hidden="true" size={24} strokeWidth={1.8} />
          <h1>Something interrupted the conversation</h1>
          <p>
            Your saved chats are still safe. Reload the app to restore the
            workspace.
          </p>
          <button onClick={() => window.location.reload()} type="button">
            <RotateCcw aria-hidden="true" size={17} strokeWidth={2} />
            Reload Synthex
          </button>
        </div>
      </main>
    );
  }
}
