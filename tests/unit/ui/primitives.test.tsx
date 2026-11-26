import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StatusBanner } from '../../../src/components/layout/StatusBanner.tsx';
import { ErrorBoundary } from '../../../src/components/ui/ErrorBoundary.tsx';
import {
  AccessibleModal,
  Badge,
  Card,
  PrimaryButton,
  SecondaryButton,
} from '../../../src/components/ui/Primitives.tsx';

function CrashingChild(): never {
  throw new Error('Chunk load error');
}

describe('UI Primitives, StatusBanner & ErrorBoundary', () => {
  it('renders Card, Badge, PrimaryButton, and SecondaryButton with accessible labels', () => {
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();
    render(
      <Card>
        <Badge>India NAQI</Badge>
        <PrimaryButton onClick={onPrimary}>Save Plan</PrimaryButton>
        <SecondaryButton onClick={onSecondary}>Cancel</SecondaryButton>
      </Card>,
    );
    expect(screen.getByText('India NAQI')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save Plan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('renders AccessibleModal dialog with title, description, and close control', () => {
    const onOpenChange = vi.fn();
    render(
      <AccessibleModal
        open={true}
        onOpenChange={onOpenChange}
        title="Dialog Heading"
        description="Dialog description"
      >
        <p>Modal content body</p>
      </AccessibleModal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Dialog Heading')).toBeInTheDocument();
    expect(screen.getByText('Modal content body')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Close dialog/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders StatusBanner for offline, AQ errors, storage warnings, AI fallback, and sample demo states', () => {
    const { container, rerender } = render(
      <StatusBanner isOnline={true} aqStatus="ready" isDemoMode={false} />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<StatusBanner isOnline={false} aqStatus="unavailable" isDemoMode={false} />);
    expect(screen.getByText(/Offline mode:/i)).toBeInTheDocument();

    rerender(
      <StatusBanner
        isOnline={true}
        aqStatus="rate_limited"
        aqErrorMessage="Provider rate limit hit"
        storageWarning="Storage quota full"
        aiStatus="unavailable"
        aiStatusDetail="Groq AI temporary outage"
        isDemoMode={false}
      />,
    );
    expect(screen.getByText(/Provider rate limit hit/i)).toBeInTheDocument();
    expect(screen.getByText(/Storage notice: Storage quota full/i)).toBeInTheDocument();
    expect(screen.getByText(/Assistant notice: Groq AI temporary outage/i)).toBeInTheDocument();

    rerender(<StatusBanner isOnline={true} aqStatus="ready" isDemoMode={true} />);
    expect(screen.getByText(/SAMPLE DEMO DATA ACTIVE/i)).toBeInTheDocument();
  });

  it('recovers gracefully inside ErrorBoundary when a lazy route crashes', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onResetRoute = vi.fn();
    render(
      <ErrorBoundary onResetRoute={onResetRoute}>
        <CrashingChild />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/This view could not be loaded/i);
    fireEvent.click(screen.getByRole('button', { name: /Return to Home Dashboard/i }));
    expect(onResetRoute).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });
});
