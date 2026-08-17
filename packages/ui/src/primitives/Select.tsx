'use client'

import * as RadixSelect from '@radix-ui/react-select'
import Icon from '#components/Icon'
import styles from './Select.module.css'

export type SelectOption = {
  value: string
  label: string
}

type SelectProps = {
  label: string
  value: string
  options: readonly SelectOption[]
  onValueChange: (value: string) => void
}

const Select = ({ label, value, options, onValueChange }: SelectProps) => (
  <label className={styles.field}>
    <span className={styles.label}>{label}</span>
    <RadixSelect.Root onValueChange={onValueChange} value={value}>
      <RadixSelect.Trigger aria-label={label} className={styles.trigger}>
        <RadixSelect.Value />
        <RadixSelect.Icon className={styles.chevron}>
          <Icon name="chevron" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content className={styles.content} position="popper" sideOffset={6}>
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item className={styles.item} key={option.value} value={option.value}>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className={styles.check}>
                  <Icon name="check" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  </label>
)

export default Select
