import React from "react";

interface SettingsCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SettingsCard({
  title,
  description,
  children,
}: SettingsCardProps) {
  return (
    <div className="flex flex-col gap-4 py-5 border-b border-border/30 last:border-0">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-1 w-1/2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </span>
        </div>
        <div className="w-1/2 flex justify-end">{children}</div>
      </div>
    </div>
  );
}
