import JSON5 from 'json5'
import { readFile } from 'fs/promises'

export async function loadJson5(filePath: string) {
  const content = await readFile(filePath, 'utf8')
  return JSON5.parse(content) // 支持 // 注释、'单引号'、末尾逗号
}
