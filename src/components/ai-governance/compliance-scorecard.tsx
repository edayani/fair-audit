"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

interface Scores {
  fairnessScore: number;
  transparencyScore: number;
  accountabilityScore: number;
  explainabilityScore: number;
  humanOversightRate: number;
  auditCompleteness: number;
  overallGrade: string;
  riskClassification: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "hsl(142, 76%, 36%)";
  if (score >= 60) return "hsl(48, 96%, 53%)";
  return "hsl(0, 84%, 60%)";
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case "A": return "bg-green-500 text-white";
    case "B": return "bg-blue-500 text-white";
    case "C": return "bg-yellow-500 text-white";
    case "D": return "bg-orange-500 text-white";
    default: return "bg-red-500 text-white";
  }
}

function getRiskBadgeColor(risk: string): string {
  switch (risk) {
    case "LOW": return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "MEDIUM": return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "HIGH": return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
    case "UNACCEPTABLE": return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    default: return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function MetricCard({ name, score }: { name: string; score: number }) {
  const color = getScoreColor(score);
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground mb-2">{name}</p>
      <div className="flex items-center gap-3">
        <RadialBarChart
          width={80}
          height={80}
          innerRadius="70%"
          outerRadius="100%"
          data={[{ value: score, fill: color }]}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={5} background={{ fill: "hsl(var(--muted))" }} />
        </RadialBarChart>
        <span className="text-2xl font-bold" style={{ color }}>
          {score.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

export function ComplianceScorecard({ scores }: { scores: Scores }) {
  const metrics = [
    { name: "Fairness", score: scores.fairnessScore },
    { name: "Transparency", score: scores.transparencyScore },
    { name: "Accountability", score: scores.accountabilityScore },
    { name: "Explainability", score: scores.explainabilityScore },
    { name: "Human Oversight", score: scores.humanOversightRate },
    { name: "Audit Completeness", score: scores.auditCompleteness },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className={`flex items-center justify-center w-20 h-20 rounded-full text-4xl font-bold ${getGradeColor(scores.overallGrade)}`}>
          {scores.overallGrade}
        </div>
        <div>
          <p className="text-lg font-semibold">Overall Compliance Grade</p>
          <span className={`inline-block mt-1 text-xs px-2.5 py-1 rounded-full border ${getRiskBadgeColor(scores.riskClassification)}`}>
            Risk: {scores.riskClassification}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.name} name={m.name} score={m.score} />
        ))}
      </div>
    </div>
  );
}
