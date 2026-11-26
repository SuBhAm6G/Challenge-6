import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`border-border-warm bg-surface rounded-2xl border p-4 shadow-[0_1px_3px_rgba(28,25,23,0.05)] sm:p-5 ${className}`}
    >
      {children}
    </section>
  );
}

export function PrimaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`bg-brand hover:bg-brand-hover inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`border-border-strong bg-canvas text-ink hover:bg-hover-warm inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  className = 'bg-subtle text-ink-body border-border-warm',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

export function AccessibleModal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-[1px]" />
        <Dialog.Content className="border-border-warm bg-canvas fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[94vw] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border p-5 shadow-xl sm:p-6">
          <div className="border-border-warm flex items-start justify-between gap-3 border-b pb-3">
            <div>
              <Dialog.Title className="text-ink text-lg font-bold">{title}</Dialog.Title>
              <Dialog.Description className="text-ink-muted mt-1 text-sm">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close dialog"
                className="border-border-warm bg-surface text-ink hover:bg-subtle inline-flex h-11 w-11 items-center justify-center rounded-xl border"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
