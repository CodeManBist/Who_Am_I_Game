import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function PrimaryButton({
  children,
  to,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
}: {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const cls = `group inline-flex items-center gap-2 rounded-md bg-[#FF5A36] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#ff6b4a] disabled:opacity-40 disabled:pointer-events-none ${className}`;
  const content = (
    <>
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {content}
    </button>
  );
}

export function SecondaryButton({
  children,
  to,
  onClick,
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const cls = `inline-flex items-center gap-2 rounded-md border border-[#2A2A25] bg-[#181815] px-5 py-2.5 text-sm font-medium text-[#F5F1E8] transition-all hover:border-[#3a3a32] hover:bg-[#211F1B] disabled:opacity-40 disabled:pointer-events-none ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
