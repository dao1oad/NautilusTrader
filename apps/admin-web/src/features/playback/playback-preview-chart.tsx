import { createChart } from "lightweight-charts";
import { useEffect, useRef } from "react";

import type { PlaybackTimelinePoint } from "../../shared/types/admin";


function toUnixTime(timestamp: string) {
  return Math.floor(new Date(timestamp).getTime() / 1000);
}


export function PlaybackPreviewChart({ timeline }: { timeline: PlaybackTimelinePoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || timeline.length === 0) {
      return;
    }

    const chart = createChart(container, {
      width: container.clientWidth || 640,
      height: 260,
      layout: {
        background: { color: "transparent" },
        textColor: "#112033"
      },
      grid: {
        vertLines: { color: "rgba(17, 32, 51, 0.08)" },
        horzLines: { color: "rgba(17, 32, 51, 0.08)" }
      },
      rightPriceScale: {
        borderVisible: false
      },
      timeScale: {
        borderVisible: false
      }
    });
    const lineSeries = chart.addLineSeries({
      color: "#1c4da6",
      lineWidth: 2
    });

    lineSeries.setData(
      timeline
        .map((point) => ({
          time: toUnixTime(point.timestamp),
          value: Number(point.mid_price)
        }))
        .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.value))
    );

    const handleResize = () => {
      chart.applyOptions({
        width: container.clientWidth || 640
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [timeline]);

  if (timeline.length === 0) {
    return <p className="resource-filter-empty">No projected playback points are available for the current request.</p>;
  }

  return <div aria-label="Playback preview chart" className="playback-chart" ref={containerRef} role="img" />;
}
