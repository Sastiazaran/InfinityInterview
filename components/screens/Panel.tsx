"use client";

import type { ReactNode } from "react";

export function Panel({
  title,
  children,
  className,
  footer,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="panel-backdrop">
      <section className={`panel ${className ?? ""}`} role="dialog" aria-label={typeof title === "string" ? title : undefined}>
        {title && <h2 className="panel-title">{title}</h2>}
        <div className="panel-body">{children}</div>
        {footer && <footer className="panel-footer">{footer}</footer>}
      </section>
    </div>
  );
}

export function KeyHint({ keys }: { keys: [string, string][] }) {
  return (
    <p className="key-hint">
      {keys.map(([key, label]) => (
        <span key={key + label}>
          <kbd>{key}</kbd> {label}
        </span>
      ))}
    </p>
  );
}
