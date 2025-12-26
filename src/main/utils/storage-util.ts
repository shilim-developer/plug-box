import storage from 'electron-json-storage'
import { join } from 'path'
import { logger } from './logger'

// const configUrl = join(app.getPath('userData'), 'config')

export function getConfigStore(baseUrl: string): typeof storage {
  storage.setDataPath(join(baseUrl, 'config'))
  return storage
}

export function getStoreDataPromise(tStorage: typeof storage, key: string) {
  return new Promise((resolve, reject) => {
    tStorage.get(key, (error: any, data: any) => {
      if (error) {
        logger.error('Failed to get settings', error)
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}

export function setStorageDataPromise(tStorage: typeof storage, key: string, json: any) {
  return new Promise((resolve, reject) => {
    tStorage.set(key, json, (error: any) => {
      if (error) {
        logger.error('Failed to update settings', error)
        reject(error)
      } else {
        resolve(json)
      }
    })
  })
}
