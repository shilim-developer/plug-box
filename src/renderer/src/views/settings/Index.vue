<template>
  <div class="h-screen bg-[#1c1c1c] flex">
    <!-- 左侧插件列表 -->
    <div class="w-64 bg-[#252525] border-r border-gray-700/50 flex flex-col">
      <div class="p-4 border-b border-gray-700/50">
        <h2 class="text-lg font-semibold text-white mb-2">已安装插件</h2>
        <div class="relative">
          <Input v-model="searchQuery" type="text" placeholder="搜索插件..." class="w-full pr-9" />
          <Search class="absolute right-3 top-2.5 text-gray-400 pointer-events-none" :size="16" />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div
          v-if="filteredPlugins.length === 0"
          class="flex flex-col items-center justify-center h-full text-gray-500 p-4"
        >
          <Package :size="48" class="mb-4" />
          <p class="text-sm">未找到已安装的插件</p>
        </div>

        <div v-else class="p-2">
          <div
            v-for="plugin in filteredPlugins"
            :key="plugin.id"
            class="p-3 mb-2 rounded-lg cursor-pointer transition-colors relative"
            :class="
              selectedPlugin?.id === plugin.id
                ? 'bg-blue-600/20 border border-blue-500/50'
                : 'bg-[#1c1c1c] border border-gray-700/50 hover:bg-[#2a2a2a]'
            "
            @click="selectPlugin(plugin)"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <img :src="plugin.logo" class="w-8 h-8" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-white truncate">
                  {{ plugin.pluginName }}
                </h3>
                <p class="text-xs text-gray-400">v{{ plugin.version }}</p>
              </div>
            </div>
            <span
              v-if="plugin.isSystem"
              class="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded border border-blue-500/30"
            >
              系统
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧配置内容 -->
    <div class="flex-1 flex flex-col">
      <div v-if="!selectedPlugin" class="flex-1 flex items-center justify-center text-gray-500">
        <div class="text-center">
          <Settings :size="48" class="mx-auto mb-4" />
          <p class="text-lg">选择一个插件查看配置</p>
          <p class="text-sm mt-2">从左侧列表中选择一个已安装的插件</p>
        </div>
      </div>

      <div v-else class="flex-1 flex flex-col min-h-0">
        <!-- 插件头部信息 -->
        <div class="p-6 border-b border-gray-700/50 bg-[#252525] flex-shrink-0">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
              >
                <img :src="selectedPlugin.logo" class="w-14 h-14" />
              </div>
              <div>
                <h1 class="text-2xl font-bold text-white">{{ selectedPlugin.pluginName }}</h1>
                <p class="text-gray-400 mt-1">{{ selectedPlugin.description || '暂无描述' }}</p>
                <div class="flex items-center gap-4 mt-2">
                  <span class="text-sm text-gray-400">版本 {{ selectedPlugin.version }}</span>
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  >
                    {{ getCategoryLabel(selectedPlugin.category || PluginCategory.OTHER) }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="!selectedPlugin.isSystem" class="flex gap-2">
              <Button variant="success" @click="openPlugin(selectedPlugin)">
                <template #icon>
                  <ExternalLink :size="16" />
                </template>
                打开插件
              </Button>
              <Button variant="danger" @click="uninstallPlugin(selectedPlugin)">
                <template #icon>
                  <Trash2 :size="16" />
                </template>
                卸载
              </Button>
            </div>
          </div>
        </div>

        <!-- 配置选项卡 -->
        <div class="bg-[#252525] border-b border-gray-700/50 shrink-0">
          <div class="flex">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="px-6 py-3 text-sm font-medium transition-colors relative"
              :class="activeTab === tab.key ? 'text-white' : 'text-gray-400 hover:text-gray-300'"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
              <div
                v-if="activeTab === tab.key"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
              />
            </button>
          </div>
        </div>

        <!-- 配置内容区域 -->
        <div class="flex-1 overflow-y-auto p-6 min-h-0">
          <!-- 常规设置 -->
          <div v-if="activeTab === 'general'" class="space-y-6">
            <div class="bg-[#1c1c1c] rounded-lg p-4 border border-gray-700/50">
              <h3 class="text-lg font-medium text-white mb-4">插件信息</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-sm text-gray-400">插件 ID</span>
                  <span class="text-sm text-white">{{ selectedPlugin.id }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-400">安装路径</span>
                  <span class="text-sm text-white truncate ml-2">{{
                    selectedPlugin.root || '未知'
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-400">后端入口</span>
                  <span class="text-sm text-white">{{ selectedPlugin.backend || '无' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-400">前端入口</span>
                  <span class="text-sm text-white">{{ selectedPlugin.view || '无' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 插件配置 -->
          <div v-if="activeTab === 'configuration'" class="space-y-6">
            <div
              v-if="
                selectedPlugin.configuration && Object.keys(selectedPlugin.configuration).length > 0
              "
              class="bg-[#1c1c1c] rounded-lg p-4 border border-gray-700/50"
            >
              <h3 class="text-lg font-medium text-white mb-4">插件配置</h3>
              <div class="space-y-4">
                <div
                  v-for="(property, key) in selectedPlugin.configuration"
                  :key="key"
                  class="space-y-2"
                >
                  <!-- Boolean 类型 -->
                  <div v-if="property.type === 'boolean'" class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-white">{{ property.title }}</label>
                      <p v-if="property.description" class="text-xs text-gray-400 mt-1">
                        {{ property.description }}
                      </p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input
                        v-model="pluginSettings.configuration[key]"
                        type="checkbox"
                        class="sr-only peer"
                      />
                      <div
                        class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                      />
                    </label>
                  </div>

                  <!-- String 类型 with enum -->
                  <div v-else-if="property.type === 'string' && property.enum">
                    <label class="text-sm font-medium text-white block mb-2">{{
                      property.title
                    }}</label>
                    <p v-if="property.description" class="text-xs text-gray-400 mb-2">
                      {{ property.description }}
                    </p>
                    <Select v-model="pluginSettings.configuration[key]">
                      <SelectTrigger class="w-full bg-[#252525] text-white border-gray-700/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="(option, index) in property.enum"
                          :key="index"
                          :value="option as string"
                        >
                          {{ property.enumDescriptions?.[index] || option }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <!-- String 类型 multiline -->
                  <div
                    v-else-if="
                      property.type === 'string' && property.editPresentation === 'multilineText'
                    "
                  >
                    <label class="text-sm font-medium text-white block mb-2">{{
                      property.title
                    }}</label>
                    <p v-if="property.description" class="text-xs text-gray-400 mb-2">
                      {{ property.description }}
                    </p>
                    <textarea
                      v-model="pluginSettings.configuration[key]"
                      rows="4"
                      class="w-full px-3 py-2 bg-[#252525] text-white rounded-lg border border-gray-700/50 focus:border-blue-500/50 focus:outline-none text-sm"
                      :placeholder="property.default?.toString() || ''"
                    />
                  </div>

                  <!-- String 类型 single line -->
                  <div v-else-if="property.type === 'string'">
                    <label class="text-sm font-medium text-white block mb-2">{{
                      property.title
                    }}</label>
                    <p v-if="property.description" class="text-xs text-gray-400 mb-2">
                      {{ property.description }}
                    </p>
                    <input
                      v-model="pluginSettings.configuration[key]"
                      type="text"
                      class="w-full px-3 py-2 bg-[#252525] text-white rounded-lg border border-gray-700/50 focus:border-blue-500/50 focus:outline-none text-sm"
                      :placeholder="property.default?.toString() || ''"
                      :minlength="property.minLength"
                      :maxlength="property.maxLength"
                      :pattern="property.pattern"
                    />
                  </div>

                  <!-- Number 类型 -->
                  <div v-else-if="property.type === 'number'">
                    <label class="text-sm font-medium text-white block mb-2">{{
                      property.title
                    }}</label>
                    <p v-if="property.description" class="text-xs text-gray-400 mb-2">
                      {{ property.description }}
                    </p>
                    <InputNumber
                      v-model="pluginSettings.configuration[key]"
                      :placeholder="property.default?.toString() || ''"
                      :min="property.minimum"
                      :max="property.maximum"
                    />
                  </div>

                  <!-- Array 类型 -->
                  <div v-else-if="property.type === 'array'">
                    <label class="text-sm font-medium text-white block mb-2">{{
                      property.title
                    }}</label>
                    <p v-if="property.description" class="text-xs text-gray-400 mb-2">
                      {{ property.description }}
                    </p>
                    <div class="space-y-2">
                      <div
                        v-for="(item, index) in pluginSettings.configuration[key] as unknown[]"
                        :key="index"
                        class="flex gap-2"
                      >
                        <!-- Array with enum - 使用 select -->
                        <select
                          v-if="property.enum"
                          v-model="(pluginSettings.configuration[key] as unknown[])[index]"
                          class="flex-1 px-3 py-2 bg-[#252525] text-white rounded-lg border border-gray-700/50 focus:border-blue-500/50 focus:outline-none text-sm"
                        >
                          <option
                            v-for="(option, optIndex) in property.enum"
                            :key="optIndex"
                            :value="option"
                          >
                            {{ property.enumDescriptions?.[optIndex] || option }}
                          </option>
                        </select>

                        <!-- Array without enum - 使用 text input -->
                        <input
                          v-else
                          v-model="(pluginSettings.configuration[key] as unknown[])[index]"
                          type="text"
                          class="flex-1 px-3 py-2 bg-[#252525] text-white rounded-lg border border-gray-700/50 focus:border-blue-500/50 focus:outline-none text-sm"
                          :placeholder="`项 ${index + 1}`"
                        />

                        <Button variant="danger" size="icon" @click="removeArrayItem(key, index)">
                          <Trash2 :size="16" />
                        </Button>
                      </div>
                      <Button variant="gray" size="sm" @click="addArrayItem(key, property.enum)">
                        添加项
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <Settings :size="48" class="mb-4" />
              <p class="text-lg">该插件没有配置项</p>
            </div>
          </div>

          <!-- 高级设置 -->
          <div v-if="activeTab === 'advanced'" class="space-y-6">
            <div class="bg-[#1c1c1c] rounded-lg p-4 border border-gray-700/50">
              <h3 class="text-lg font-medium text-white mb-4">高级选项</h3>
              <div class="space-y-4">
                <div>
                  <label class="text-sm font-medium text-white block mb-2">自定义配置</label>
                  <textarea
                    v-model="pluginSettings.customConfig"
                    rows="6"
                    class="w-full px-3 py-2 bg-[#252525] text-white rounded-lg border border-gray-700/50 focus:border-blue-500/50 focus:outline-none text-sm font-mono"
                    placeholder="输入 JSON 格式的自定义配置..."
                  />
                </div>

                <div>
                  <label class="text-sm font-medium text-white block mb-2">环境变量</label>
                  <div class="space-y-2">
                    <div
                      v-for="(env, index) in pluginSettings.environment"
                      :key="index"
                      class="flex gap-2"
                    >
                      <Input v-model="env.key" type="text" placeholder="键" class="flex-1" />
                      <Input v-model="env.value" type="text" placeholder="值" class="flex-1" />
                      <Button
                        variant="danger"
                        size="icon"
                        @click="removeEnvironmentVariable(index)"
                      >
                        <Trash2 :size="16" />
                      </Button>
                    </div>
                    <Button variant="gray" size="sm" @click="addEnvironmentVariable">
                      添加环境变量
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 权限设置 -->
          <div v-if="activeTab === 'permissions'" class="space-y-6">
            <div class="bg-[#1c1c1c] rounded-lg p-4 border border-gray-700/50">
              <h3 class="text-lg font-medium text-white mb-4">权限管理</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-white">文件系统访问</label>
                    <p class="text-xs text-gray-400 mt-1">允许插件读取和写入文件</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      v-model="pluginSettings.permissions.fileSystem"
                      type="checkbox"
                      class="sr-only peer"
                    />
                    <div
                      class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                    />
                  </label>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-white">网络访问</label>
                    <p class="text-xs text-gray-400 mt-1">允许插件访问网络资源</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      v-model="pluginSettings.permissions.network"
                      type="checkbox"
                      class="sr-only peer"
                    />
                    <div
                      class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                    />
                  </label>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-white">系统通知</label>
                    <p class="text-xs text-gray-400 mt-1">允许插件发送系统通知</p>
                  </div>
                  <Switch v-model:checked="pluginSettings.permissions.notifications" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作按钮 -->
        <div class="p-4 border-t border-gray-700/50 bg-[#252525]">
          <div class="flex justify-end gap-3">
            <Button variant="gray" @click="resetSettings"> 重置设置 </Button>
            <Button variant="default" @click="saveSettings"> 保存设置 </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { Search, Package, Settings, ExternalLink, Trash2 } from 'lucide-vue-next'
import { trpcClient } from '@renderer/trpc/trpc-client'
import { Button } from '@renderer/components/ui/button'
import { Input, InputNumber } from '@renderer/components/ui/input'
import { Switch } from '@renderer/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { deepToRaw } from '@renderer/utils/utils'
import { PluginCategory } from '@common/constants/plugin-category'

interface Plugin {
  id: string
  version: string
  pluginName: string
  description?: string
  view?: string
  backend?: string
  root?: string
  category?: string
  logo?: string
  isSystem?: boolean
  configuration?: ConfigurationSchema
}

interface ConfigurationProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
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

type ConfigurationSchema = Record<string, ConfigurationProperty>

interface PluginSettings {
  enabled: boolean
  autoStart: boolean
  customConfig: string
  environment: { key: string; value: string }[]
  permissions: {
    fileSystem: boolean
    network: boolean
    notifications: boolean
  }
  configuration: Record<string, any>
}

const searchQuery = ref('')
const plugins = ref<Plugin[]>([])
const selectedPlugin = ref<Plugin | null>(null)
const activeTab = ref('general')
const isLoading = ref(false)
const uninstallingPlugins = ref<Set<string>>(new Set())

const tabs = [
  { key: 'configuration', label: '配置' },
  { key: 'general', label: '常规' }
  // { key: 'advanced', label: '高级' },
  // { key: 'permissions', label: '权限' }
]

const defaultSettings: PluginSettings = {
  enabled: true,
  autoStart: false,
  customConfig: '',
  environment: [],
  permissions: {
    fileSystem: false,
    network: false,
    notifications: false
  },
  configuration: {}
}

const pluginSettings = ref<PluginSettings>({ ...defaultSettings })

const filteredPlugins = computed(() => {
  if (!searchQuery.value.trim()) return plugins.value

  const query = searchQuery.value.toLowerCase()
  return plugins.value.filter(
    (plugin) =>
      plugin.pluginName.toLowerCase().includes(query) ||
      plugin.description?.toLowerCase().includes(query) ||
      ''
  )
})

onMounted(async () => {
  await loadInstalledPlugins()
})

async function loadInstalledPlugins() {
  try {
    isLoading.value = true
    const pluginList = await trpcClient.plugin.getInstalledPluginList.query()
    plugins.value = pluginList

    // 默认选择第一个插件
    if (pluginList.length > 0) {
      selectPlugin(pluginList[0])
    }
  } catch (error) {
    console.error('加载已安装插件失败:', error)
  } finally {
    isLoading.value = false
  }
}

async function selectPlugin(plugin: Plugin) {
  pluginSettings.value = { ...defaultSettings, configuration: {} }

  try {
    const [schema, settings] = await Promise.all([
      trpcClient.settings.getConfigurationSchema.query({ pluginId: plugin.id }),
      trpcClient.settings.getSettings.query({ pluginId: plugin.id })
    ])

    // 创建新对象并添加 schema
    selectedPlugin.value = {
      ...plugin,
      configuration: schema as ConfigurationSchema
    }

    // 初始化配置值,如果设置中没有值则使用默认值
    const configuration: Record<string, unknown> = {}
    if (schema) {
      for (const [key, property] of Object.entries(schema as ConfigurationSchema)) {
        // 如果 settings 中有值就用 settings 的值,否则用默认值
        if (key in settings) {
          configuration[key] = settings[key]
        } else {
          configuration[key] = property.default
        }
      }
    }

    pluginSettings.value.configuration = configuration
    console.log('pluginSettings:', pluginSettings)
  } catch (error) {
    console.error('加载插件配置失败:', error)
  }
}
function openPlugin(plugin: Plugin) {
  trpcClient.plugin.sendMessage.mutate({ type: 'openPlugin', data: plugin })
}

async function uninstallPlugin(plugin: Plugin) {
  if (confirm(`确定要卸载插件 "${plugin.pluginName}" 吗？`)) {
    uninstallingPlugins.value.add(plugin.id)
    try {
      await trpcClient.plugin.uninstallPlugin.mutate({ id: plugin.id })
      await loadInstalledPlugins()
      if (selectedPlugin.value?.id === plugin.id) {
        selectedPlugin.value = null
      }
    } catch (error) {
      console.error('卸载插件失败:', error)
    } finally {
      uninstallingPlugins.value.delete(plugin.id)
    }
  }
}

function addEnvironmentVariable() {
  pluginSettings.value.environment.push({ key: '', value: '' })
}

function removeEnvironmentVariable(index: number) {
  pluginSettings.value.environment.splice(index, 1)
}

function addArrayItem(key: string, enumValues?: unknown[]) {
  if (!Array.isArray(pluginSettings.value.configuration[key])) {
    pluginSettings.value.configuration[key] = []
  }

  const defaultValue = enumValues && enumValues.length > 0 ? enumValues[0] : ''

  ;(pluginSettings.value.configuration[key] as unknown[]).push(defaultValue)
}

function removeArrayItem(key: string, index: number) {
  if (Array.isArray(pluginSettings.value.configuration[key])) {
    ;(pluginSettings.value.configuration[key] as unknown[]).splice(index, 1)
  }
}

async function resetSettings() {
  if (!selectedPlugin.value) return

  if (confirm(`确定要重置插件 "${selectedPlugin.value.pluginName}" 的所有设置吗？`)) {
    try {
      // 重置后端配置
      await trpcClient.settings.resetSettings.mutate({
        pluginId: selectedPlugin.value.id
      })

      // 重置前端配置到默认值
      const configuration: Record<string, unknown> = {}
      if (selectedPlugin.value.configuration) {
        for (const [key, property] of Object.entries(selectedPlugin.value.configuration)) {
          configuration[key] = property.default
        }
      }

      pluginSettings.value.configuration = configuration

      console.log(`插件 "${selectedPlugin.value.pluginName}" 的设置已重置`)
      alert('设置已重置到默认值')
    } catch (error) {
      console.error('重置设置失败:', error)
      alert('重置设置失败，请重试')
    }
  }
}

async function saveSettings() {
  if (!selectedPlugin.value) return

  try {
    // 保存插件配置到后端
    await trpcClient.settings.updateSettings.mutate(
      deepToRaw({
        pluginId: selectedPlugin.value.id,
        settings: pluginSettings.value.configuration
      })
    )
    // 可以添加成功通知
    // 例如使用 toast 或其他通知组件
    alert('设置保存成功！')
  } catch (error) {
    console.error('保存设置失败:', error)
    alert('保存设置失败，请重试')
  }
}

function getCategoryLabel(category: string) {
  return PluginCategory.label(category)
}
</script>
