import { PluginCategory } from '@common/constants/plugin-category'
export interface Plugin {
  id: string
  version: string
  pluginName: string
  description: string
  view: string
  backend?: string
  isSystem?: boolean
  logo?: string
  category?: typeof PluginCategory.valueType
  installed?: boolean
  configuration?: ConfigurationSchema
}

export interface ConfigurationProperty {
  type: 'string' | 'number' | 'boolean' | 'array'
  itemType?: any
  default?: unknown
  title: string
  description?: string
  enum?: unknown[]
  enumDescriptions?: string[]
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  patternErrorMessage?: string
  format?: string
  properties?: Record<string, ConfigurationProperty>
  deprecationMessage?: string
  editPresentation?: 'singlelineText' | 'multilineText'
}

export type ConfigurationSchema = Record<string, ConfigurationProperty>
