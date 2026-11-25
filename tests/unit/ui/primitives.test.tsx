import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StatusBanner } from '../../../src/components/layout/StatusBanner.tsx';
import {
  AccessibleModal,
  Badge,
  Card,
  PrimaryButton,
  SecondaryButton,
} from '../../../src/components/ui/Primitives.tsx';

describe('UI Primitives & StatusBanner', () => {
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

  it('renders StatusBanner conditionally for offline, unavailable provider, and sample demo states', () => {
    const { container, rerender } = render(
      <StatusBanner isOnline={true} aqStatus="ready" isDemoMode={false} />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<StatusBanner isOnline={false} aqStatus="unavailable" isDemoMode={false} />);
    expect(screen.getByText(/Offline mode:/i)).toBeInTheDocument();

    rerender(<StatusBanner isOnline={true} aqStatus="unavailable" isDemoMode={false} />);
    expect(screen.getByText(/Air-quality forecast provider unreachable/i)).toBeInTheDocument();

    rerender(<StatusBanner isOnline={true} aqStatus="ready" isDemoMode={true} />);
    expect(screen.getByText(/SAMPLE DEMO DATA ACTIVE/i)).toBeInTheDocument();
  });
});
