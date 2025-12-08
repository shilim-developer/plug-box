<template>
  <div class="backdrop-blur-sm flex flex-col h-full">
    <!-- 分类标签 -->
    <div class="px-4 py-3 bg-[#1c1c1c] border-b border-gray-700/30">
      <div class="flex gap-2 overflow-x-auto">
        <button
          v-for="category in categories"
          :key="category"
          class="px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors"
          :class="
            selectedCategory === category
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
          @click="selectCategory(category)"
        >
          {{ category }}
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
          v-for="(plugin, index) in filteredPlugins"
          :key="plugin.id"
          class="bg-[#252525] rounded-lg p-4 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
              >
                <Package :size="20" class="text-white"></Package>
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
                {{ getCategoryLabel(plugin.category || 'utility') }}
              </span>
            </div>

            <div class="flex gap-2">
              <button
                v-if="!plugin.installed"
                class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                @click="installPlugin(plugin)"
              >
                安装
              </button>
              <button
                v-else
                class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                @click="openPlugin(plugin)"
              >
                打开
              </button>
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
import { ref, onMounted, computed } from 'vue'
import { PackageOpen, Package, PackageSearch, Star, RefreshCw, Settings } from 'lucide-vue-next'
import { trpcClient } from '@renderer/trpc/trpc-client'

interface Plugin {
  id: string
  version: string
  pluginName: string
  description?: string
  view?: string
  backend?: string
  root?: string
  category?: string
  installed?: boolean
}

const searchQuery = ref('')
const plugins = ref<Plugin[]>([])
const selectedCategory = ref('全部')
const isLoading = ref(false)

const categories = ['全部', '开发工具', '效率工具', '娱乐', '系统工具', '图形设计', '其他']

const filteredPlugins = computed(() => {
  let result = plugins.value

  // 按分类筛选
  if (selectedCategory.value !== '全部') {
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
})

async function loadPlugins() {
  try {
    isLoading.value = true
    const pluginList = await trpcClient.plugin.getPluginList.query()

    // 为插件添加模拟数据
    plugins.value = pluginList.map((plugin) => ({
      ...plugin,
      category: getRandomCategory(),
      installed: Math.random() > 0.5,
      description: generateDescription(plugin.pluginName)
    }))
  } catch (error) {
    console.error('加载插件列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

function handleSearch() {
  // 搜索逻辑已在 computed 中处理
}

function selectCategory(category: string) {
  selectedCategory.value = category
}

function refreshPlugins() {
  loadPlugins()
}

function installPlugin(plugin: Plugin) {
  console.log('安装插件:', plugin.pluginName)
  // TODO: 实现安装逻辑
}

function openPlugin(plugin: Plugin) {
  trpcClient.plugin.openPlugin.mutate({ id: plugin.id })
}

function showPluginDetails(plugin: Plugin) {
  console.log('显示插件详情:', plugin.pluginName)
  // TODO: 实现详情显示逻辑
}

function getRandomCategory() {
  return categories[Math.floor(Math.random() * (categories.length - 1)) + 1]
}

function getCategoryLabel(category: string) {
  return category
}

function generateDescription(name: string) {
  const descriptions = [
    '一个功能强大的插件，提供丰富的工具和功能',
    '提升您的工作效率，简化日常操作',
    '为您的应用程序带来全新的体验',
    '专业的解决方案，满足您的各种需求',
    '简单易用的工具，让您的工作更加轻松'
  ]
  return descriptions[Math.floor(Math.random() * descriptions.length)]
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
