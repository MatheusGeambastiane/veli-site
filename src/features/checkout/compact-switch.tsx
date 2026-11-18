import { Info } from "lucide-react";

type CompactSwitchProps = {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
  tooltip?: string;
};

export function CompactSwitch({ checked, label, onCheckedChange, tooltip }: CompactSwitchProps) {
  return (
    <div className="flex items-center gap-4 text-[11px] leading-4 text-muted-foreground">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onCheckedChange(!checked)}
        className={`relative h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
          checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <button
        type="button"
        className="text-left hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
        onClick={() => onCheckedChange(!checked)}
      >
        {label}
      </button>
      {tooltip ? (
        <span className="group relative inline-flex shrink-0" tabIndex={0} aria-label={tooltip}>
          <Info className="size-3.5 cursor-help text-muted-foreground" aria-hidden="true" />
          <span role="tooltip" className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden w-72 rounded-lg bg-foreground px-3 py-2 text-left text-xs font-normal leading-5 text-background shadow-lg group-hover:block group-focus:block">
            {tooltip}
          </span>
        </span>
      ) : null}
    </div>
  );
}
