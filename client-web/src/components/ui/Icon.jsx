import React from 'react';
import { useIconMode } from '../../context/IconModeContext';

/**
 * Icon wrapper
 * Props:
 * - children: icon element
 * - important: boolean — treat as important in compact mode
 * - forceShow: boolean — always render regardless of global mode
 * - className: optional classes to apply to wrapper
 */
export default function Icon({ children, important = false, forceShow = false, className = '' }) {
  const { mode } = useIconMode();

  if (forceShow) {
    return <span className={className} aria-hidden>{children}</span>;
  }

  if (mode === 'full') return <span className={className} aria-hidden>{children}</span>;
  if (mode === 'none') return null;

  // compact: show important icons normally; de-emphasize others
  if (mode === 'compact') {
    if (important) return <span className={className} aria-hidden>{children}</span>;
    // less important icons: low opacity, reveal on hover (requires parent .group)
    return (
      <span className={`${className} opacity-40 group-hover:opacity-100 transition-opacity`} aria-hidden>
        {children}
      </span>
    );
  }

  return <span className={className} aria-hidden>{children}</span>;
}
