import React from 'react';

export function triggerViewChange(path: string) {
  if (typeof window !== 'undefined') {
    const cleanPath = path.replace(/^\/+/, ''); // Remove leading slash
    const event = new CustomEvent('ecotrack-view-change', { detail: cleanPath || 'landing' });
    window.dispatchEvent(event);
  }
}

export function Link({ href, children, className, onClick, ...props }: any) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) onClick(e);
    triggerViewChange(href);
  };

  return (
    <a href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

export default Link;
