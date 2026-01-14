<template>
  <div class="backdrop-blur-sm flex flex-col h-full">
    <!-- 分类标签 -->
    <div class="px-4 py-3 bg-[#1c1c1c] border-b border-gray-700/30">
      <div class="flex gap-2 overflow-x-auto">
        <button
          v-for="category in categories"
          :key="category.value"
          class="px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors"
          :class="
            selectedCategory === category.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
          @click="selectCategory(category.value)"
        >
          {{ category.label }}
        </button>
      </div>
    </div>

    <div class="flex-1 bg-[#1c1c1c] overflow-auto">
      <div
        v-if="filteredPlugins.length === 0"
        class="flex flex-col items-center justify-center h-full text-gray-500"
      >
        <PackageSearch :size="48" class="mb-4"></PackageSearch>
        <p class="text-lg">未找到相关插件</p>
        <p class="text-sm mt-2">请尝试其他搜索词或分类</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-4 p-4">
        <div
          v-for="plugin in filteredPlugins"
          :key="plugin.id"
          class="bg-[#252525] rounded-lg p-4 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
              >
                <img :src="plugin.logo" class="w-10,h-10" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white">{{ plugin.pluginName }}</h3>
                <p class="text-sm text-gray-400">版本 {{ plugin.version }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span
                class="px-2 py-1 text-xs rounded"
                :class="
                  plugin.installed
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-gray-600/20 text-gray-400'
                "
              >
                {{ plugin.installed ? '已安装' : '未安装' }}
              </span>
            </div>
          </div>

          <p class="text-sm text-gray-400 mb-4 line-clamp-2">
            {{ plugin.description || '暂无描述' }}
          </p>

          <div class="flex items-center justify-between">
            <div class="flex gap-2">
              <span class="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                {{ getCategoryLabel(plugin.category || PluginCategory.OTHER) }}
              </span>
            </div>

            <div class="flex gap-2">
              <button
                v-if="!plugin.installed"
                class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                :disabled="installingPlugins.has(plugin.id)"
                @click="installPlugin(plugin)"
              >
                <RefreshCw
                  v-if="installingPlugins.has(plugin.id)"
                  :size="14"
                  class="animate-spin"
                />
                {{ installingPlugins.has(plugin.id) ? '安装中...' : '安装' }}
              </button>
              <template v-else>
                <button
                  class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  @click="openPlugin(plugin)"
                >
                  打开
                </button>
                <button
                  class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                  :disabled="uninstallingPlugins.has(plugin.id)"
                  @click="uninstallPlugin(plugin)"
                >
                  <RefreshCw
                    v-if="uninstallingPlugins.has(plugin.id)"
                    :size="14"
                    class="animate-spin"
                  />
                  {{ uninstallingPlugins.has(plugin.id) ? '卸载中...' : '卸载' }}
                </button>
              </template>
              <button
                class="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                @click="showPluginDetails(plugin)"
              >
                详情
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, toRaw } from 'vue'
import { PackageSearch, RefreshCw } from 'lucide-vue-next'
import { trpcClient } from '@renderer/trpc/trpc-client'
import { PluginCategory } from '@common/constants/plugin-category'
import { Plugin } from '@common/types/plugin'

const searchQuery = ref('')
const plugins = ref<Plugin[]>([])
const selectedCategory = ref('ALL')
const isLoading = ref(false)
const installingPlugins = ref<Set<string>>(new Set())
const uninstallingPlugins = ref<Set<string>>(new Set())

const categories = [
  {
    label: '全部',
    value: 'ALL'
  },
  ...PluginCategory.items
]

const filteredPlugins = computed(() => {
  let result = plugins.value

  // 按分类筛选
  if (selectedCategory.value !== 'ALL') {
    result = result.filter((plugin) => plugin.category === selectedCategory.value)
  }

  // 按搜索词筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (plugin) =>
        plugin.pluginName.toLowerCase().includes(query) ||
        plugin.description?.toLowerCase().includes(query) ||
        ''
    )
  }

  return result
})

onMounted(async () => {
  await loadPlugins()
  trpcClient.plugin.message.subscribe(undefined, {
    onData: (data: { type: string; data: any }) => {
      if (data.type === 'inputEnter') {
        searchQuery.value = data.data
      }
    }
  })
})

async function loadPlugins() {
  try {
    isLoading.value = true
    const pluginList = await trpcClient.plugin.getMarketplacePluginList.query()
    const installedIds = await (
      await trpcClient.plugin.getInstalledPluginList.query()
    ).map((item) => item.id)
    console.log(installedIds)

    plugins.value = pluginList.map((plugin) => ({
      ...plugin,
      installed: installedIds.includes(plugin.id)
    }))
  } catch (error) {
    console.error('加载插件列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

function selectCategory(category: string) {
  selectedCategory.value = category
}

async function installPlugin(plugin: Plugin) {
  console.log('安装插件:', plugin.pluginName)
  installingPlugins.value.add(plugin.id)
  try {
    await trpcClient.plugin.installPlugin.mutate({ id: plugin.id })
    await loadPlugins()
  } catch (error) {
    console.error('安装插件失败:', error)
  } finally {
    installingPlugins.value.delete(plugin.id)
  }
}

function uninstallPlugin(plugin: Plugin) {
  console.log('卸载插件:', plugin.pluginName)
  uninstallingPlugins.value.add(plugin.id)
  trpcClient.plugin.uninstallPlugin
    .mutate({ id: plugin.id })
    .then(() => {
      // 卸载成功后刷新插件列表
      loadPlugins()
    })
    .catch((error) => {
      console.error('卸载插件失败:', error)
    })
    .finally(() => {
      uninstallingPlugins.value.delete(plugin.id)
    })
}

function openPlugin(plugin: Plugin) {
  trpcClient.plugin.sendMessage.mutate({ type: 'openPlugin', data: toRaw(plugin) })
}

function showPluginDetails(plugin: Plugin) {
  console.log('显示插件详情:', plugin.pluginName)
  // TODO: 实现详情显示逻辑
}

function getCategoryLabel(category: string) {
  return PluginCategory.label(category)
}
</script>

<style lang="scss" scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
