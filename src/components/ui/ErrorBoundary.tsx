import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onResetRoute?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches lazy-chunk load or rendering failures so offline/unexpected errors never white-screen the UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void error;
    void info;
  }

  private handleRecover = () => {
    this.setState({ hasError: false });
    this.props.onResetRoute?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-950"
        >
          <h2 className="text-base font-bold">This view could not be loaded</h2>
          <p className="mt-1">
            If you are offline or a section update arrived, try returning to the dashboard or
            reloading this view.
          </p>
          <button
            type="button"
            onClick={this.handleRecover}
            className="bg-brand hover:bg-brand-hover mt-4 inline-flex min-h-[44px] items-center rounded-xl px-4 py-2 text-sm font-semibold text-white"
          >
            Return to Home Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
