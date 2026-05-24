import React from "react";

interface SettingsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function SettingsInput({ label, ...props }: SettingsInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <input
        {...props}
        className="bg-background border border-border/50 text-foreground text-sm px-3 py-2 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
      />
    </div>
  );
}
