<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@renderer/lib/utils'

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue
})
</script>

<template>
  <input
    v-model="modelValue"
    data-slot="input"
    :class="
      cn(
        'h-9 w-full min-w-0 rounded-lg border border-gray-700/50 bg-[#252525] px-3 py-2 text-sm text-white placeholder:text-gray-400 transition-colors outline-none',
        'focus:border-blue-500/50',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white',
        props.class
      )
    "
  />
</template>
