import { cn } from "@/lib/utils";

interface LinearGaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  className?: string;
  height?: number;
}

export function LinearGauge({
  value,
  max,
  label,
  unit,
  className,
  height = 8
}: LinearGaugeProps) {
  const percentage = Math.min(Math.max(value, 0), max) / max * 100;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold text-primary">
          {value} {unit}
        </span>
      </div>
      <div className="relative">
        <div 
          className="w-full bg-muted rounded-full"
          style={{ height: `${height}px` }}
        >
          <div
            className="bg-gradient-to-r from-chart-primary to-chart-secondary h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0 {unit}</span>
          <span>{max} {unit}</span>
        </div>
      </div>
    </div>
  );
}