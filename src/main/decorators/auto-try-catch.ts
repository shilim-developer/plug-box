import { BaseResponse } from '@common/constants/base-response'
import { logger } from '../utils/logger'

// 定义一个装饰器函数
export function autoTryCatch(
  errorHandler: {
    errorMsg: string
    errorCallback?: () => Promise<void>
  } = {
    errorMsg: '操作失败'
  }
) {
  return (_, propertyKey, descriptor) => {
    // 保存原始的方法
    const originalMethod = descriptor.value

    // 用一个新的函数替换原始方法
    descriptor.value = async function (...args) {
      try {
        // 执行原始方法
        args.push(errorHandler)
        const result = await originalMethod.apply(this, args)
        return result
      } catch (error) {
        // 统一的错误处理逻辑
        logger.error(`Error occurred in ${propertyKey}:`, error)
        if (errorHandler.errorCallback) {
          await errorHandler.errorCallback()
        }
        return BaseResponse.failMessage(errorHandler.errorMsg)
      }
    }
    return descriptor
  }
}
