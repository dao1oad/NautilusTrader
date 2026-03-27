import type { ComponentPropsWithoutRef, ReactNode } from "react";


type Props = Omit<ComponentPropsWithoutRef<"header">, "title"> & {
  actions?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  summary?: ReactNode;
  title: ReactNode;
  titleLevel?: "h1" | "h2";
};

export function WorkbenchHeader({
  actions,
  children,
  className,
  description,
  eyebrow,
  summary,
  title,
  titleLevel = "h1",
  ...rest
}: Props) {
  const TitleTag = titleLevel;
  const headerClassName = className ? `workbench-header ${className}` : "workbench-header";

  return (
    <header className={headerClassName} {...rest}>
      <div className="workbench-header-main">
        <div className="workbench-header-copy">
          {eyebrow ? <p className="workbench-header-eyebrow">{eyebrow}</p> : null}
          <TitleTag className="workbench-header-title">{title}</TitleTag>
          {description ? <p className="workbench-header-description">{description}</p> : null}
          {summary ? <p className="workbench-header-summary">{summary}</p> : null}
        </div>
        {actions ? <div className="workbench-header-actions">{actions}</div> : null}
      </div>
      {children ? <div className="workbench-header-body">{children}</div> : null}
    </header>
  );
}
