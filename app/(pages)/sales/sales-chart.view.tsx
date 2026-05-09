"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DailyChartEntry } from "./sales.types";
import { formatCents } from "./sales.types";

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
              height: 8,
              borderRadius: 2,
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
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: isMobile ? 10 : 20,
            left: isMobile ? -10 : 10,
            bottom: isMobile ? 10 : 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="date"
            tick={{
              fill: "#737373",
              fontSize: isMobile ? 9 : 10,
            }}
            tickFormatter={xTickFormatter}
            stroke="#262626"
            interval={isMobile ? "preserveStartEnd" : 0}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? "end" : "middle"}
            height={isMobile ? 50 : 30}
          />
          <YAxis
            yAxisId="count"
            tick={{ fill: "#737373", fontSize: isMobile ? 9 : 10 }}
            stroke="#262626"
            width={isMobile ? 30 : 40}
          />
          <YAxis
            yAxisId="revenue"
            orientation="right"
            tick={isMobile ? false : { fill: "#737373", fontSize: 10 }}
            tickFormatter={isMobile ? undefined : (v: number) => `R$${(v / 100).toFixed(0)}`}
            axisLine={!isMobile}
            stroke="#262626"
            width={isMobile ? 0 : 55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) =>
              value === "count" ? "Vendas" : "Faturamento"
            }
            wrapperStyle={{ fontSize: 10, color: "#737373" }}
            verticalAlign={isMobile ? "top" : "bottom"}
            align={isMobile ? "right" : "center"}
            iconSize={isMobile ? 8 : 10}
          />
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="count"
            stroke="#2563EB"
            strokeWidth={2}
            dot={false}
            name="count"
          />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="#059669"
            strokeWidth={2}
            dot={false}
            name="revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
