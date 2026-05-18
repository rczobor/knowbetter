import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'
import type { ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      richColors
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': '#ecfdf3',
          '--success-border': '#bbf7d0',
          '--success-text': '#166534',
          '--info-bg': '#eff6ff',
          '--info-border': '#bfdbfe',
          '--info-text': '#1d4ed8',
          '--warning-bg': '#fffbeb',
          '--warning-border': '#fde68a',
          '--warning-text': '#92400e',
          '--error-bg': '#fff1f2',
          '--error-border': '#fecdd3',
          '--error-text': '#be123c',
          '--border-radius': 'var(--radius)',
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          title: 'font-semibold text-current',
          description: 'text-current/85',
          icon: 'text-current',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
