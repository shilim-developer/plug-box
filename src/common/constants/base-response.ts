import { STATUS_CODE } from './status-code'

export class BaseResponse<T> {
  code: number
  data?: T
  message: string
  constructor(code: number, data: T, message: string) {
    this.code = code
    this.data = data
    this.message = message
  }

  static success<T>(data: T): BaseResponse<T>
  static success<T>(data: T, message: string): BaseResponse<T>
  static success<T>(param1: T, param2?: string) {
    return new BaseResponse<T>(STATUS_CODE.OK, param1, param2 || '成功')
  }
  static successMessage<T>(message: string): BaseResponse<T> {
    return new BaseResponse<T>(STATUS_CODE.OK, undefined as any, message)
  }

  static fail<T>(data: T): BaseResponse<T>
  static fail<T>(data: T, message: string): BaseResponse<T>
  static fail<T>(param1: T, param2?: string) {
    return new BaseResponse<T>(STATUS_CODE.Error, param1, param2 || '失败')
  }
  static failMessage<T>(message: string): BaseResponse<T> {
    return new BaseResponse<T>(STATUS_CODE.Error, undefined as any, message)
  }
}
