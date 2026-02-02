import type React from "react";

interface DiffBadgeProps {
  value: number;
  label?: string;
}

export const DiffBadge: React.FC<DiffBadgeProps> = ({ value, label }) => {
  if (value === 0) {
    return (
      <span className="text-gray-500 text-sm">{label ? `${label}:` : ""}0</span>
    );
  }

  const isPositive = value > 0;
  const colorClass = isPositive ? "text-green-400" : "text-red-400";
  const sign = isPositive ? "+" : "";

  const labelText = label ? `${label}:` : "";

  return (
    <span className={`${colorClass} text-sm font-medium`}>
      {labelText}
      {sign}
      {value}
    </span>
  );
};
