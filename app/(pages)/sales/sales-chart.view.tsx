"use client";

import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import type { DailyChartEntry } from "./sales.types";
import { formatCents } from "./sales.types";

type RechartsModule = typeof import("recharts");
type RechartsDynamicProps = Record<string, unknown> & {
  children?: ReactNode;
};

const loadRechartsComponent = async <Key extends keyof RechartsModule>(
  key: Key,
): Promise<ComponentType<RechartsDynamicProps>> => {
  const rechartsModule = await import("recharts");
  return rechartsModule[key] as unknown as ComponentType<RechartsDynamicProps>;
};

const Area = dynamic<RechartsDynamicProps>(
  () => loadRechartsComponent("Area"),
  { ssr: false },
);
const AreaChart = dynamic<RechartsDynamicProps>(
  () => loadRechartsComponent("AreaChart"),
  { ssr: false },
);
const CartesianGrid = dynamic<RechartsDynamicProps>(
  () => loadRechartsComponent("CartesianGrid"),
  { ssr: false },
);
const Legend = dynamic<RechartsDynamicProps>(
  () => loadRechartsComponent("Legend"),
  { ssr: false },
);
const ResponsiveContainer = dynamic<RechartsDynamicProps>(
  () => loadRechartsComponent("ResponsiveContainer"),
  { ssr: false },
);
const Tooltip = dynamic<RechartsDynamicProps>(
  () => loadRechartsComponent("Tooltip"),
  { ssr: false },
);
const XAxis = dynamic<RechartsDynamicProps>(
  () => loadRechartsComponent("XAxis"),
  { ssr: false },
);
const YAxis = dynamic<RechartsDynamicProps>(
  () => loadRechartsComponent("YAxis"),
  { ssr: false },
);

interface SalesChartProps {
  data: DailyChartEntry[];
}

const useIsMobile = (breakpoint = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
};

const formatXAxisLabel = (value: string, isMobile: boolean): string => {
  const parts = value.split("-");
  const label = `${parts[1]}/${parts[2]}`;
  return isMobile ? label : `${parts[2]}/${parts[1]}`;
};

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        backgroundColor: "#171717",
        border: "1px solid #262626",
        borderRadius: "4px",
        color: "#e5e5e5",
        fontSize: 12,
        padding: "8px 12px",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>
        {label?.split("-").reverse().join("/")}
      </div>
      {payload.map((entry) => (
        <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <div
            style={{
              width: 8,
              height: 2,
              borderRadius: 1,
              backgroundColor: entry.color,
            }}
          />
          <span style={{ color: "#a3a3a3" }}>
            {entry.name === "count" ? "Vendas" : "Faturamento"}
          </span>
          <span style={{ fontWeight: 700, marginLeft: "auto", paddingLeft: 12 }}>
            {entry.name === "count"
              ? entry.value
              : formatCents(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const SalesChart = ({ data }: SalesChartProps) => {
  const isMobile = useIsMobile();

  const xTickFormatter = useCallback(
    (value: string) => formatXAxisLabel(value, isMobile),
    [isMobile],
  );

  return (
    <div className="h-72 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: isMobile ? 10 : 20,
            left: isMobile ? -10 : 10,
            bottom: isMobile ? 10 : 5,
          }}
        >
          <defs>
            <linearGradient id="gradientCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="none"
            stroke="#1f1f1f"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{
              fill: "#525252",
              fontSize: isMobile ? 9 : 10,
            }}
            tickFormatter={xTickFormatter}
            stroke="transparent"
            tickLine={false}
            interval={isMobile ? "preserveStartEnd" : 0}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? "end" : "middle"}
            height={isMobile ? 50 : 30}
          />
          <YAxis
            yAxisId="count"
            tick={{ fill: "#525252", fontSize: isMobile ? 9 : 10 }}
            stroke="transparent"
            tickLine={false}
            axisLine={false}
            width={isMobile ? 30 : 40}
          />
          <YAxis
            yAxisId="revenue"
            orientation="right"
            tick={isMobile ? false : { fill: "#525252", fontSize: 10 }}
            tickFormatter={isMobile ? undefined : (v: number) => `R$${(v / 100).toFixed(0)}`}
            stroke="transparent"
            tickLine={false}
            axisLine={false}
            width={isMobile ? 0 : 55}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "#333333", strokeDasharray: "4 4" }}
          />
          <Legend
            formatter={(value: string) =>
              value === "count" ? "Vendas" : "Faturamento"
            }
            wrapperStyle={{ fontSize: 10, color: "#525252" }}
            verticalAlign={isMobile ? "top" : "bottom"}
            align={isMobile ? "right" : "center"}
            iconType="plainline"
            iconSize={isMobile ? 12 : 14}
          />
          <Area
            yAxisId="count"
            type="monotone"
            dataKey="count"
            stroke="#2563EB"
            strokeWidth={1.5}
            fill="url(#gradientCount)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0, fill: "#2563EB" }}
            name="count"
          />
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="#059669"
            strokeWidth={1.5}
            fill="url(#gradientRevenue)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0, fill: "#059669" }}
            name="revenue"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
