import { Enum } from 'enum-plus'

export const PluginCategory = Enum({
  SYSTEM: { value: 'SYSTEM', label: '系统' },
  DEVELOP: { value: 'DEVELOP', label: '开发' },
  EFFICIENCY: { value: 'EFFICIENCY', label: '效率' },
  ENTERTAINMENT: { value: 'ENTERTAINMENT', label: '娱乐' },
  DESIGN: { value: 'DESIGN', label: '设计' },
  OTHER: { value: 'OTHER', label: '其他' }
} as const)
