import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-[#E4DCCD] bg-white p-4 shadow-[0_1px_3px_rgba(28,25,23,0.05)] sm:p-5 ${className}`}
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
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0F6E56] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0B5341] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-4 py-2 text-sm font-medium text-[#1C1917] transition-colors hover:bg-[#EFE8DA] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  className = 'bg-[#F3EDE2] text-[#44403C] border-[#E4DCCD]',
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
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[94vw] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#E4DCCD] bg-[#FAF7F2] p-5 shadow-xl sm:p-6">
          <div className="flex items-start justify-between gap-3 border-b border-[#E4DCCD] pb-3">
            <div>
              <Dialog.Title className="text-lg font-bold text-[#1C1917]">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[#57534E]">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close dialog"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4DCCD] bg-white text-[#1C1917] hover:bg-[#F3EDE2]"
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
