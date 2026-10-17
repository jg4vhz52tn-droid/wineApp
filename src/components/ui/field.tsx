import { useId } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-control border border-border bg-surface-2/60 px-4 text-base text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none";

type FieldProps = { label: string; hint?: string; error?: string };

export function TextField({
  label,
  hint,
  error,
  className,
  ...props
}: FieldProps & React.ComponentProps<"input">) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          control,
          "h-12 min-w-0",
          // iOS gives date/time inputs a wide intrinsic size and centres them - keep them in their column.
          (props.type === "date" || props.type === "time") &&
            "appearance-none text-left [&::-webkit-date-and-time-value]:text-left",
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-desc` : undefined}
        {...props}
      />
      {(error || hint) && (
        <p id={`${id}-desc`} className={cn("text-sm", error ? "text-danger" : "text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  className,
  ...props
}: FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <textarea id={id} className={cn(control, "min-h-28 py-3")} {...props} />
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}
