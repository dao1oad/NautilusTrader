import type { ComponentPropsWithoutRef, ReactNode } from "react";


type Props = Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  actions?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  signal?: ReactNode;
  title?: ReactNode;
};

export function SectionPanel({
  actions,
  children,
  className,
  description,
  eyebrow,
  meta,
  signal,
  title,
  ...rest
}: Props) {
  const panelClassName = className ? `section-panel ${className}` : "section-panel";
  const hasHeader = Boolean(eyebrow) || Boolean(title) || Boolean(description) || Boolean(signal) || Boolean(actions);

  return (
    <section className={panelClassName} {...rest}>
      {hasHeader ? (
        <div className="section-panel-header">
          <div className="section-panel-copy-stack">
            {eyebrow ? <p className="section-panel-eyebrow">{eyebrow}</p> : null}
            {(title || signal) ? (
              <div className="section-panel-title-row">
                {title ? <h2 className="section-panel-title">{title}</h2> : null}
                {signal ? <div className="section-panel-signal">{signal}</div> : null}
              </div>
            ) : null}
            {description ? <p className="section-panel-copy">{description}</p> : null}
          </div>
          {actions ? <div className="section-panel-actions">{actions}</div> : null}
        </div>
      ) : null}
      {meta ? <div className="section-panel-meta">{meta}</div> : null}
      {children ? <div className="section-panel-body">{children}</div> : null}
    </section>
  );
}
