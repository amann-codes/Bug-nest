import * as React from "react"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const SheetContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>({ open: false, onOpenChange: () => {} })

function Sheet({ children, open = false, onOpenChange }: SheetProps) {
  const [isOpen, setIsOpen] = React.useState(open)
  
  React.useEffect(() => {
    setIsOpen(open)
  }, [open])
  
  const handleOpenChange = React.useCallback((value: boolean) => {
    setIsOpen(value)
    onOpenChange?.(value)
  }, [onOpenChange])
  
  return (
    <SheetContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

type SheetTriggerElement = React.ElementRef<"button">

interface SheetTriggerProps extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean;
}

const SheetTrigger = React.forwardRef<SheetTriggerElement, SheetTriggerProps>(
  ({ children, asChild = false, ...props }, ref) => {
    const { onOpenChange } = React.useContext(SheetContext)
    
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        props.onClick?.(event)
        onOpenChange(true)
      },
      [onOpenChange, props.onClick]
    )
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(
        children,
        {
          ...props,
          ref,
          "data-slot": "sheet-trigger",
          onClick: handleClick,
        } as React.ButtonHTMLAttributes<HTMLButtonElement>
      )
    }
    
    return (
      <button
        ref={ref}
        type="button"
        data-slot="sheet-trigger"
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    )
  }
)

type SheetCloseElement = React.ElementRef<"button">

interface SheetCloseProps extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean;
}

const SheetClose = React.forwardRef<SheetCloseElement, SheetCloseProps>(
  ({ children, asChild = false, ...props }, ref) => {
    const { onOpenChange } = React.useContext(SheetContext)
    
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        props.onClick?.(event)
        onOpenChange(false)
      },
      [onOpenChange, props.onClick]
    )
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(
        children,
        {
          ...props,
          ref,
          "data-slot": "sheet-close",
          onClick: handleClick,
        } as React.ButtonHTMLAttributes<HTMLButtonElement>
      )
    }
    
    return (
      <button
        ref={ref}
        type="button"
        data-slot="sheet-close"
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    )
  }
)

function SheetPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function SheetOverlay({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, onOpenChange } = React.useContext(SheetContext)
  
  if (!open) return null
  
  return (
    <div
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50",
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  )
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left"
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: SheetContentProps) {
  const { open, onOpenChange } = React.useContext(SheetContext)
  
  if (!open) return null
  
  return (
    <SheetPortal>
      <SheetOverlay />
      <div
        data-slot="sheet-content"
        className={cn(
          "bg-background fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out duration-300",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto border-t",
          className
        )}
        {...props}
      >
        {children}
        <SheetClose className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetClose>
      </div>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
