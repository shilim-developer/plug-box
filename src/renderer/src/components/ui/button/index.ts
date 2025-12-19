import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  'cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-700',
        success: 'bg-green-600 text-white hover:bg-green-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        gray: 'bg-gray-700 text-white hover:bg-gray-600',
        outline: 'border border-gray-700/50 bg-transparent text-white hover:bg-gray-700/50',
        ghost: 'bg-transparent text-white hover:bg-gray-700/50',
        link: 'text-blue-500 underline-offset-4 hover:underline'
      },
      size: {
        default: 'px-4 py-2',
        sm: 'px-3 py-1.5 text-xs',
        lg: 'px-6 py-3 text-base',
        icon: 'p-2'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
