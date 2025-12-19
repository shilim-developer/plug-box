import { injectable } from 'inversify'
import type { ConfigurationSchema, ConfigurationProperty } from '@common/types/plugin'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { app } from 'electron'

@injectable()
export class SettingsService {
  private configPath: string
  private settings: Record<string, unknown> = {}
  private schemas: Map<string, ConfigurationSchema> = new Map()

  constructor() {
    this.configPath = join(app.getPath('userData'), 'settings.json')
    this.loadSettings()
  }

  private async loadSettings() {
    try {
      const data = await readFile(this.configPath, 'utf-8')
      this.settings = JSON.parse(data)
    } catch {
      this.settings = {}
    }
  }

  private async saveSettings() {
    try {
      await writeFile(this.configPath, JSON.stringify(this.settings, null, 2), 'utf-8')
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  registerConfiguration(pluginId: string, schema: ConfigurationSchema) {
    this.schemas.set(pluginId, schema)
  }

  unregisterConfiguration(pluginId: string) {
    this.schemas.delete(pluginId)
  }

  getConfigurationSchema(pluginId?: string): ConfigurationSchema | Record<string, ConfigurationSchema> {
    if (pluginId) {
      return this.schemas.get(pluginId) || {}
    }
    return Object.fromEntries(this.schemas.entries())
  }

  private getDefaultValue(property: ConfigurationProperty): unknown {
    if (property.default !== undefined) {
      return property.default
    }
    switch (property.type) {
      case 'string':
        return ''
      case 'number':
        return 0
      case 'boolean':
        return false
      case 'array':
        return []
      case 'object':
        return {}
      default:
        return undefined
    }
  }

  private getDefaultsFromSchema(schema: ConfigurationSchema): Record<string, unknown> {
    const defaults: Record<string, unknown> = {}

    for (const [key, property] of Object.entries(schema)) {
      defaults[key] = this.getDefaultValue(property)
    }

    return defaults
  }

  async getSettings(pluginId?: string): Promise<Record<string, unknown>> {
    await this.loadSettings()

    if (pluginId) {
      const schema = this.schemas.get(pluginId)
      if (!schema) {
        return {}
      }

      const defaults = this.getDefaultsFromSchema(schema)
      const pluginSettings: Record<string, unknown> = {}

      for (const key of Object.keys(defaults)) {
        pluginSettings[key] = this.settings[key] ?? defaults[key]
      }

      return pluginSettings
    }

    const allDefaults: Record<string, unknown> = {}
    for (const schema of this.schemas.values()) {
      Object.assign(allDefaults, this.getDefaultsFromSchema(schema))
    }

    return { ...allDefaults, ...this.settings }
  }

  async getSetting(key: string): Promise<unknown> {
    await this.loadSettings()
    return this.settings[key]
  }

  async updateSettings(settings: Record<string, unknown>): Promise<Record<string, unknown>> {
    await this.loadSettings()
    Object.assign(this.settings, settings)
    await this.saveSettings()
    return this.settings
  }

  async updateSetting(key: string, value: unknown): Promise<void> {
    await this.loadSettings()
    this.settings[key] = value
    await this.saveSettings()
  }

  async resetSettings(pluginId?: string): Promise<void> {
    if (pluginId) {
      const schema = this.schemas.get(pluginId)
      if (!schema) {
        return
      }

      const defaults = this.getDefaultsFromSchema(schema)
      for (const key of Object.keys(defaults)) {
        delete this.settings[key]
      }
    } else {
      this.settings = {}
    }

    await this.saveSettings()
  }
}
