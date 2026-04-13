"use client";
// Spec §4.F — Fairness visualization
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface GroupMetric {
  groupName: string;
  total: number;
  approved: number;
  denied: number;
  conditional: number;
  approvalRate: number;
}

export function FairnessChart({ groups }: { groups: GroupMetric[] }) {
  const data = groups.map((g) => ({
    name: g.groupName,
    approvalRate: Math.round(g.approvalRate * 100),
    total: g.total,
  }));

  if (data.length === 0) return <p className="text-sm text-muted-foreground">Insufficient data</p>;

  const maxRate = Math.max(...data.map((d) => d.approvalRate));
  const threshold = Math.round(maxRate * 0.8);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => [`${value}%`, "Approval Rate"]} />
        <ReferenceLine y={threshold} stroke="red" strokeDasharray="5 5" label={{ value: "80% rule", position: "right", fontSize: 10 }} />
        <Bar dataKey="approvalRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
