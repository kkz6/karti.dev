import * as React from "react"
import { Button } from "@shared/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/components/ui/tooltip"
import { type VariantProps } from "class-variance-authority"
import { type buttonVariants } from "@shared/components/ui/button"

interface TooltipButtonProps 
  extends React.ComponentProps<typeof Button>,
    VariantProps<typeof buttonVariants> {
  tooltip: string | React.ReactNode
  tooltipSide?: "top" | "right" | "bottom" | "left"
  tooltipAlign?: "start" | "center" | "end"
  tooltipDelayDuration?: number
  tooltipSideOffset?: number
}

const TooltipButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  TooltipButtonProps
>(({ 
  tooltip, 
  tooltipSide = "top", 
  tooltipAlign = "center",
  tooltipDelayDuration = 0,
  tooltipSideOffset = 4,
  children, 
  ...props 
}, ref) => {
  return (
    <Tooltip delayDuration={tooltipDelayDuration}>
      <TooltipTrigger asChild>
        <Button ref={ref} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent 
        side={tooltipSide} 
        align={tooltipAlign}
        sideOffset={tooltipSideOffset}
      >
        {typeof tooltip === 'string' ? <p>{tooltip}</p> : tooltip}
      </TooltipContent>
    </Tooltip>
  )
})

TooltipButton.displayName = "TooltipButton"

export { TooltipButton }
