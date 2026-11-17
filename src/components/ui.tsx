import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Check, ChevronRight, MoreHorizontal, X } from 'lucide-preact';

export function Button(
  props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-solid';
  },
) {
  const { variant = 'secondary', class: cls, ...rest } = props;
  return <button class={`btn btn-${variant} ${cls ?? ''}`} {...rest} />;
}

export function Chip({
  tone = 'neutral',
  children,
  icon,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  children: ComponentChildren;
  icon?: ComponentChildren;
}) {
  return (
    <span class={`chip chip-${tone}`}>
      {icon}
      {children}
    </span>
  );
}

export function ProgressBar({ value, done }: { value: number; done?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div class={`progress-bar ${done || v >= 100 ? 'done' : ''}`} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${v}%` }} />
    </div>
  );
}

export function ProgressRing({
  value,
  total,
  size = 28,
}: {
  value: number;
  total: number;
  size?: 28 | 44;
}) {
  const pct = total === 0 ? 0 : value / total;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const done = total > 0 && value >= total;
  return (
    <svg class="progress-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-muted)" stroke-width={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={done ? 'var(--success)' : 'var(--accent)'}
        stroke-width={stroke}
        stroke-linecap="round"
        stroke-dasharray={c}
        stroke-dashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {size === 44 && (
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text)">
          {value}/{total}
        </text>
      )}
    </svg>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav class="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && <span class="sep">/</span>}
          {item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function IconBtn(props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  const { label, children, class: cls, ...rest } = props;
  return (
    <button type="button" class={`icon-btn ${cls ?? ''}`} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

export function OverflowMenu({ items }: { items: { label: string; onClick?: () => void; href?: string; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <IconBtn label="More actions" onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal size={18} strokeWidth={1.75} />
      </IconBtn>
      {open && (
        <div class="menu" role="menu">
          {items.map((item) =>
            item.href ? (
              <a key={item.label} href={item.href} role="menuitem" onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                style={item.danger ? { color: 'var(--danger)' } : undefined}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function Dialog({
  title,
  children,
  onClose,
  actions,
}: {
  title: string;
  children: ComponentChildren;
  onClose: () => void;
  actions: ComponentChildren;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div class="backdrop" role="presentation" onClick={onClose}>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        <div>{children}</div>
        <div class="dialog-actions">{actions}</div>
      </div>
    </div>
  );
}

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 3000);
    return () => window.clearTimeout(t);
  }, [message, onDone]);
  return (
    <div class="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  help,
  action,
}: {
  icon: ComponentChildren;
  title: string;
  help?: string;
  action?: ComponentChildren;
}) {
  return (
    <div class="empty">
      <div class="empty-icon">{icon}</div>
      <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
      {help && <div>{help}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function ActivityIconBox({
  color,
  children,
}: {
  color: string;
  children: ComponentChildren;
}) {
  return (
    <div class="activity-icon" style={{ background: `${color}1a`, color }}>
      {children}
    </div>
  );
}

export function RowChevron() {
  return <ChevronRight class="row-chevron" size={18} strokeWidth={1.75} />;
}

export function DoneTick() {
  return <Check size={12} strokeWidth={2} />;
}

export function CloseIcon() {
  return <X size={18} strokeWidth={1.75} />;
}

export function FileDrop({
  onFiles,
  accept,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      class={`dropzone ${drag ? 'drag' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const list = e.dataTransfer?.files;
        if (list) onFiles([...list]);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
    >
      <div>Drop files here or <span style={{ color: 'var(--accent)' }}>browse</span></div>
      <div class="field-help">Up to 20 files, 20 MB each</div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        class="sr-only"
        onChange={(e) => {
          const files = [...((e.target as HTMLInputElement).files ?? [])];
          onFiles(files);
          (e.target as HTMLInputElement).value = '';
        }}
      />
    </div>
  );
}
