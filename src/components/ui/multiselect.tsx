import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectorProps {
  values: string[];
  onValuesChange: (values: string[]) => void;
  className?: string;
  children: React.ReactNode;
}

const MultiSelector = ({
  values,
  onValuesChange,
  className,
  children,
}: MultiSelectorProps) => {
  return <div className={cn("relative w-full", className)}>{children}</div>;
};

const MultiSelectorTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </div>
));
MultiSelectorTrigger.displayName = "MultiSelectorTrigger";

const MultiSelectorInput = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, children, ...props }, ref) => (
  <span ref={ref} className={cn("flex-1", className)} {...props}>
    {children || placeholder}
  </span>
));
MultiSelectorInput.displayName = "MultiSelectorInput";

const MultiSelectorContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
MultiSelectorContent.displayName = "MultiSelectorContent";

const MultiSelectorList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("max-h-60 overflow-y-auto", className)}
    {...props}
  >
    {children}
  </div>
));
MultiSelectorList.displayName = "MultiSelectorList";

const MultiSelectorItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  const [isSelected, setIsSelected] = React.useState(false);

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={() => setIsSelected(!isSelected)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
});
MultiSelectorItem.displayName = "MultiSelectorItem";

export {
  MultiSelector,
  MultiSelectorTrigger,
  MultiSelectorInput,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorItem,
};
