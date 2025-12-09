export interface Plugin {
  id: string
  version: string
  pluginName: string
  description: string
  view: string
  backend: string
  isSystem?: boolean
}
