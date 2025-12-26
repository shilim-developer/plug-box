import { injectable } from 'inversify'
import {
  getConfigStore,
  getStoreDataPromise,
  setStorageDataPromise
} from '@main/utils/storage-util'
import { logger } from '@main/utils/logger'

@injectable()
export default class SettingsService {
  private store: any

  async init(appPath: string) {
    this.store = getConfigStore(appPath)
    logger.info('Settings service initialized')
  }

  async getSettings(pluginId?: string): Promise<Record<string, unknown>> {
    const settingJson: Record<string, any> =
      (await getStoreDataPromise(this.store, 'setting')) || {}

    if (pluginId) {
      return settingJson[pluginId]?.configuration || {}
    }

    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(settingJson)) {
      if (value && typeof value === 'object' && 'configuration' in value) {
        result[key] = (value as any).configuration
      }
    }

    return result
  }

  async getSetting(pluginId: string, key: string): Promise<unknown> {
    const settingJson: Record<string, any> =
      (await getStoreDataPromise(this.store, 'setting')) || {}
    const pluginSettings = settingJson[pluginId]?.configuration || {}
    return pluginSettings[key]
  }

  async updateSettings(pluginId: string, settings: Record<string, unknown>): Promise<any> {
    const settingJson: Record<string, any> = this.store.getSync('setting') || {}

    if (!settingJson[pluginId]) {
      settingJson[pluginId] = { configuration: {}, version: '1.0.0' }
    }

    Object.assign(settingJson[pluginId].configuration, settings)
    return setStorageDataPromise(this.store, 'setting', settingJson)
  }

  async updateSetting(pluginId: string, key: string, value: unknown): Promise<any> {
    const settingJson: Record<string, any> = this.store.getSync('setting') || {}

    if (!settingJson[pluginId]) {
      settingJson[pluginId] = { configuration: {}, version: '1.0.0' }
    }
    settingJson[pluginId].configuration[key] = value
    return setStorageDataPromise(this.store, 'setting', settingJson)
  }

  async resetSettings(pluginId: string): Promise<any> {
    const settingJson: Record<string, any> = this.store.getSync('setting') || {}
    if (settingJson[pluginId]) {
      settingJson[pluginId].configuration = {}
      return setStorageDataPromise(this.store, 'setting', settingJson)
    }
  }

  async getAllSettings(): Promise<Record<string, unknown>> {
    return this.store.getSync('setting') || {}
  }

  async saveSettings(settings: Record<string, unknown>): Promise<any> {
    return setStorageDataPromise(this.store, 'setting', settings)
  }
}
