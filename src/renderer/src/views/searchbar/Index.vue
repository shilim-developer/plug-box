<template>
  <div class="backdrop-blur-sm flex flex-col h-full">
    <div
      class="h-[60px] flex items-center px-4 py-4 border-b border-gray-700/50 relative bg-[#1c1c1c]"
    >
      <div class="flex justify-center text-blue-400">
        <div
          v-if="enterApp"
          class="flex items-center gap-2 text-xl border border-gray-700 rounded px-2 py-1 text-blue-400"
        >
          <img
            v-if="currentPlugin.logo"
            :src="currentPlugin.logo"
            :alt="currentPlugin.pluginName"
            class="w-6 h-6 rounded"
          />
          <ToolCase v-else :size="24" />
          <span>{{ currentPlugin.pluginName }}</span>
          <X :size="20" color="#6a7282" class="cursor-pointer" @click="closePlugin" />
        </div>
      </div>
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        class="flex-1 bg-transparent border-none outline-none text-xl px-2 text-blue-400 placeholder-gray-500 font-light focus:ring-0"
        :placeholder="enterApp ? '按 Esc 退出' : '输入关键词搜索...'"
        autofocus
        @input="handleInput"
        @keydown="handleKeydown"
      />
      <div
        class="w-[40px] h-[40px] mt-[5px] flex items-center gap-2 text-xs text-gray-500 font-mono border border-gray-700 rounded-full"
        style="-webkit-app-region: drag"
      >
        <!-- <span>Logo</span> -->
        <img
          class="w-full h-full rounded-full"
          src="@renderer/assets/image/logo.png"
          alt=""
          srcset=""
        />
      </div>
    </div>
    <div class="flex-1 bg-[#1c1c1c] overflow-auto">
      <div
        v-for="(item, index) in filterList"
        :key="index"
        class="h-[60px] flex items-center px-4 py-3 cursor-pointer transition-colors duration-75"
        :class="`${index === selectedIndex ? 'bg-[#303342] border-l-4 border-blue-500' : 'border-l-4 border-transparent/30 hover:bg-[#252525]'}`"
        @click="handleClick(item)"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline justify-between mb-0.5">
            <h3
              class="text-lg font-medium truncate"
              :class="index === selectedIndex ? 'text-white' : 'text-gray-300'"
            >
              <span v-html="highlightPluginName(item.pluginName, item.matchIndex)"></span>
            </h3>
          </div>
          <p class="text-sm text-gray-500 truncate">
            {{ item.version }}
          </p>
        </div>
      </div>
    </div>
    <div
      class="bg-[#181818] h-6 px-4 flex items-center justify-between text-gray-500 text-xs"
      style="-webkit-app-region: drag"
    >
      <span>plug-box</span>
      <Settings
        :size="16"
        class="cursor-pointer hover:text-white transition-colors"
        style="-webkit-app-region: no-drag"
        @click="openSettings"
      ></Settings>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { ToolCase, Settings, X } from 'lucide-vue-next'
import { trpcClient } from '@renderer/trpc/trpc-client'
import { Plugin } from '@common/types/plugin'
import { match } from 'pinyin-pro'

const query = ref('')
const rawQuery = ref('')
const list = ref<Plugin[]>([])
const selectedIndex = ref(0)
const currentPlugin = ref<Plugin>({} as Plugin)
const enterApp = computed(() => !!currentPlugin.value.id)
const filterList = computed(() => {
  return rawQuery.value
    ? list.value
        .map((item) => ({
          ...item,
          matchIndex: match(item.pluginName, rawQuery.value, { continuous: true })
        }))
        .filter((item) => item.pluginName.includes(rawQuery.value) || item.matchIndex)
    : []
})

function initHeight() {
  trpcClient.window.setMainWindowHeight.mutate({ height: 60 + 24 + filterList.value.length * 60 })
}

watch(filterList, () => {
  initHeight()
  selectedIndex.value = 0
  trpcClient.plugin.closePlugin.mutate()
})

watch(query, () => {
  selectedIndex.value = 0
  if (!enterApp.value) {
    rawQuery.value = query.value
  }
})

onMounted(async () => {
  list.value = await trpcClient.plugin.getInstalledPluginList.query()
  console.log('list.value :', list.value)
  list.value = [...list.value]
  trpcClient.plugin.message.subscribe(undefined, {
    onData: (data: { type: string; data: any }) => {
      if (data.type === 'openPlugin') {
        console.log(data)
        handleClick(data.data)
      }
    }
  })
  initHeight()
})

function handleClick(item) {
  console.log('item:', item.InstallLocation + item.appName)
  trpcClient.plugin.openPlugin.mutate({ id: item.id })
  enterApp.value = true
  currentPlugin.value = item
  query.value = ''
}

function handleInput(e) {
  if (!enterApp.value) {
    query.value = e.target.value
  }
}

async function handleKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (selectedIndex.value < filterList.value.length - 1) {
      selectedIndex.value++
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (filterList.value[selectedIndex.value]) {
      handleClick(filterList.value[selectedIndex.value])
    }
  } else if (e.key === 'Escape') {
    closePlugin()
  }
}

const inputRef = ref<HTMLInputElement>()

function closePlugin() {
  trpcClient.plugin.closePlugin.mutate()
  currentPlugin.value = {} as Plugin
  refreshPluginList()
  rawQuery.value = ''
  initHeight()
  nextTick(() => {
    inputRef.value?.focus()
  })
}

async function openSettings() {
  currentPlugin.value = (await trpcClient.plugin.openPlugin.mutate({ id: 'settings' })).data
}

async function refreshPluginList() {
  list.value = await trpcClient.plugin.getInstalledPluginList.query()
  initHeight()
}

function highlightPluginName(pluginName: string, matchIndex: number[]) {
  if (!matchIndex || matchIndex.length === 0) {
    return pluginName
  }

  let result = ''
  for (let i = 0; i < pluginName.length; i++) {
    if (matchIndex.includes(i)) {
      // 添加高亮标记
      result += `<span class="text-blue-400 font-medium">${pluginName[i]}</span>`
    } else {
      result += pluginName[i]
    }
  }

  return result
}
</script>
<style lang="scss" scoped></style>
