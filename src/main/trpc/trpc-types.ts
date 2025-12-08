/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnyProcedure } from '@trpc/server'

export type GetMethodPath<T, P extends string = ''> = T extends AnyProcedure // 如果 T 是一个对象
  ? P
  : {
      [K in keyof T]: GetMethodPath<
        T[K],
        `${P}` extends '' ? `${P}${K & string}` : `${P}.${K & string}`
      >
    }[keyof T]

export type RouterFilterTypes<T extends (...args: any) => any> = GetMethodPath<ReturnType<T>>

// 1. 路径拆分
type SplitPath<T extends string> = T extends `${infer Head}.${infer Tail}`
  ? [Head, ...SplitPath<Tail>]
  : T extends ''
    ? []
    : [T]

// 2. 获取嵌套类型
type GetNestedType<T, Path extends string[]> = Path extends [
  infer Head extends string,
  ...infer Tail extends string[]
]
  ? T extends null | undefined
    ? undefined
    : Head extends keyof T
      ? GetNestedType<T[Head], Tail>
      : undefined
  : T extends (...args: any) => any
    ? T // 保留完整函数类型
    : T // 非函数类型

// 3. 构建路径对象
type BuildPathObject<T, Path extends string[]> = Path extends [
  infer Head extends string,
  ...infer Tail extends string[]
]
  ? { [K in Head]: BuildPathObject<T, Tail> }
  : T
// 示例：BuildPathObject<number, ['a','b']> → { a: { b: number } }

// 4. 对象合并
type MergeObjects<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U
    ? K extends keyof T
      ? T[K] extends object
        ? U[K] extends object
          ? MergeObjects<T[K], U[K]> // 递归合并嵌套对象
          : U[K] // 非对象类型直接覆盖
        : U[K] // 非对象类型直接覆盖
      : U[K] // 新属性
    : K extends keyof T
      ? T[K] // 保留原有属性
      : never
}

// 5. 多路径选择
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type PickMultiplePaths<T, Paths extends readonly string[], Result = {}> = Paths extends [
  infer First extends string,
  ...infer Rest extends string[]
]
  ? PickMultiplePaths<
      T,
      Rest,
      MergeObjects<Result, BuildPathObject<GetNestedType<T, SplitPath<First>>, SplitPath<First>>>
    >
  : Result
