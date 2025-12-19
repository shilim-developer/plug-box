<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '.'
import { Primitive } from 'reka-ui'
import { cn } from '@renderer/lib/utils'
import { buttonVariants } from '.'

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  loading: false,
  disabled: false
})
</script>

<template>
  <Primitive
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    :disabled="disabled || loading"
  >
    <slot name="icon" />
    <slot />
  </Primitive>
</template>
