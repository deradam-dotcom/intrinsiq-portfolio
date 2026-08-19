'use client'

import * as RadixPopover from '@radix-ui/react-popover'
import type { ReactNode } from 'react'
import styles from './Popover.module.css'

type PopoverProps = {
  trigger: ReactNode
  children: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

const Popover = ({ trigger, children, open, onOpenChange, className }: PopoverProps) => (
  <RadixPopover.Root onOpenChange={onOpenChange} open={open}>
    <RadixPopover.Trigger className={className}>{trigger}</RadixPopover.Trigger>
    <RadixPopover.Portal>
      <RadixPopover.Content
        className={styles.content}
        onMouseEnter={() => onOpenChange(true)}
        onMouseLeave={() => onOpenChange(false)}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onOpenAutoFocus={(event) => event.preventDefault()}
        sideOffset={6}
      >
        {children}
        <RadixPopover.Arrow className={styles.arrow} />
      </RadixPopover.Content>
    </RadixPopover.Portal>
  </RadixPopover.Root>
)

export default Popover
