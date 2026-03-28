import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { SignalTone } from "./signal-pill";
import { SignalPill } from "./signal-pill";
import { SectionPanel } from "./section-panel";


export type ActivityRailItem = {
  href?: string;
  id: string;
  meta?: ReactNode;
  summary?: ReactNode;
  timestamp?: string | null;
  title: ReactNode;
  tone?: SignalTone;
};

type Props = Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  description?: ReactNode;
  emptyState?: ReactNode;
  items: ActivityRailItem[];
  sourceLabel?: ReactNode;
  sourceTone?: SignalTone;
  title: ReactNode;
};

function formatActivityTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) {
    return null;
  }

  const parsedTimestamp = new Date(timestamp);
  if (Number.isNaN(parsedTimestamp.getTime())) {
    return null;
  }

  return parsedTimestamp.toISOString().replace("T", " ").slice(0, 16);
}

function ActivityRailItemBody({ item }: { item: ActivityRailItem }) {
  return (
    <>
      <div className="audit-item-header">
        <p className="audit-item-command">{item.title}</p>
        {item.timestamp ? (
          <time className="activity-rail-timestamp" dateTime={new Date(item.timestamp).toISOString()}>
            {formatActivityTimestamp(item.timestamp)}
          </time>
        ) : null}
      </div>
      {item.summary ? <p className="command-receipt-copy">{item.summary}</p> : null}
      {item.meta ? <p className="command-receipt-copy">{item.meta}</p> : null}
    </>
  );
}

export function ActivityRail({
  className,
  description,
  emptyState = "No recent activity has been recorded yet.",
  items,
  sourceLabel,
  sourceTone = "neutral",
  title,
  ...rest
}: Props) {
  const railClassName = className ? `activity-rail ${className}` : "activity-rail";

  return (
    <SectionPanel
      className={railClassName}
      description={description}
      signal={sourceLabel ? <SignalPill label={sourceLabel} tone={sourceTone} /> : null}
      title={title}
      {...rest}
    >
      {items.length === 0 ? (
        <p className="resource-filter-empty">{emptyState}</p>
      ) : (
        <ol aria-label={typeof title === "string" ? title : undefined} className="detail-list">
          {items.map((item) => (
            <li className="audit-item" key={item.id}>
              {item.href ? (
                <a className="activity-rail-link" href={item.href}>
                  <ActivityRailItemBody item={item} />
                </a>
              ) : (
                <ActivityRailItemBody item={item} />
              )}
            </li>
          ))}
        </ol>
      )}
    </SectionPanel>
  );
}
