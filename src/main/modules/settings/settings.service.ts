import { inject, injectable } from 'inversify'
import { app } from 'electron'
import TrpcService from '../trpc/trpc.service'

@injectable()
export default class SettingsService {
  constructor(
    @inject(TrpcService)
    private readonly trpcService: TrpcService
  ) {}

  async init() {
    const appPath = app.getPath('userData')
    return this.trpcService.extensionTrpcClient.settings.init.mutate({ appPath })
  }

  async getSettings(pluginId?: string): Promise<Record<string, unknown>> {
    return this.trpcService.extensionTrpcClient.settings.getSettings.query({ pluginId })
  }

  async getSetting(pluginId: string, key: string): Promise<unknown> {
    return this.trpcService.extensionTrpcClient.settings.getSetting.query({ pluginId, key })
  }

  async updateSettings(
    pluginId: string,
    settings: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return this.trpcService.extensionTrpcClient.settings.updateSettings.mutate({
      pluginId,
      settings
    })
  }

  async updateSetting(pluginId: string, key: string, value: unknown): Promise<void> {
    return this.trpcService.extensionTrpcClient.settings.updateSetting.mutate({
      pluginId,
      key,
      value
    })
  }

  async resetSettings(pluginId: string): Promise<void> {
    return this.trpcService.extensionTrpcClient.settings.resetSettings.mutate({ pluginId })
  }

  async getAllSettings(): Promise<Record<string, unknown>> {
    return this.trpcService.extensionTrpcClient.settings.getAllSettings.query()
  }

  async saveSettings(settings: Record<string, unknown>): Promise<void> {
    return this.trpcService.extensionTrpcClient.settings.saveSettings.mutate({ settings })
  }

  async getConfigurationSchema(pluginId: string): Promise<Record<string, unknown>> {
    const plugin = await this.trpcService.extensionTrpcClient.extension.getPlugin.query({
      id: pluginId
    })
    return plugin?.configuration || {}
  }
}
