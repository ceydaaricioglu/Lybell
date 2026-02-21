'use client';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional title; when set, a close (X) button is shown in the header */
  title?: string;
  /** Max width of the content box */
  maxWidth?: 'sm' | 'md';
  dark?: boolean;
  /** Extra class for the content box (e.g. max-h-[80vh] overflow-y-auto) */
  contentClassName?: string;
  /** If true, clicking overlay closes the modal */
  closeOnOverlayClick?: boolean;
  /** If true, inner content wrapper has no padding (for custom layout with own header) */
  contentNoPadding?: boolean;
}

export default function Modal({
  open,
  onClose,
  children,
  title,
  maxWidth = 'md',
  dark = false,
  contentClassName = '',
  closeOnOverlayClick = true,
  contentNoPadding = false,
}: ModalProps) {
  if (!open) return null;

  const maxWidthClass = maxWidth === 'sm' ? 'max-w-sm' : 'max-w-md';
  const boxClass = `rounded-3xl w-full ${maxWidthClass} shadow-2xl ${dark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'} ${contentClassName}`;
  const innerWrapClass = title ? 'px-6 pb-6' : contentNoPadding ? 'p-0' : 'p-6';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal'}
    >
      <div
        className={boxClass}
        onClick={(e) => e.stopPropagation()}
      >
        {(title !== undefined && title !== '') && (
          <div className="flex items-center justify-between mb-6 px-6 pt-6">
            <h2 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-stone-800'}`}>{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
                dark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
              }`}
              aria-label="Kapat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className={innerWrapClass}>{children}</div>
      </div>
    </div>
  );
}
