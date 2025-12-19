<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@renderer/lib/utils'

const props = defineProps<{
  defaultValue?: number
  modelValue?: number
  min?: number
  max?: number
  step?: number
  hideControls?: boolean
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue
})
</script>

<template>
  <input
    v-model.number="modelValue"
    type="number"
    data-slot="input-number"
    :min="min"
    :max="max"
    :step="step"
    :class="
      cn(
        'h-9 w-full min-w-0 rounded-lg border border-gray-700/50 bg-[#252525] px-3 py-2 text-sm text-white placeholder:text-gray-400 transition-colors outline-none',
        'focus:border-blue-500/50',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        hideControls &&
          '[appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden',
        props.class
      )
    "
  />
</template>

<style scoped>
/* 确保步进器显示 */
input[type='number'] {
  -moz-appearance: textfield;
}

input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: auto;
  opacity: 1;
  margin: 0;
  cursor: pointer;
}

/* 自定义步进器样式 - 使用 filter 改变颜色 */
input[type='number']::-webkit-inner-spin-button {
  filter: brightness(0.8);
}

input[type='number']::-webkit-inner-spin-button:hover {
  filter: brightness(1);
}

input[type='number']::-webkit-inner-spin-button:active {
  filter: brightness(1.2) hue-rotate(200deg);
}
</style>
