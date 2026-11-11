import { APP_CONFIG } from '../config.js';

/** Único ponto de acesso ao LocalStorage; todas as chaves usam o namespace do app. */
export const StorageService = Object.freeze({
  key(name) { return `${APP_CONFIG.storagePrefix}:v${APP_CONFIG.storageVersion}:${name}`; },
  get(name, fallback = null) {
    try {
      const raw = globalThis.localStorage?.getItem(this.key(name));
      return raw === null || raw === undefined ? fallback : JSON.parse(raw);
    } catch (error) {
      console.error(`Não foi possível ler "${name}" do armazenamento local.`, error);
      return fallback;
    }
  },
  set(name, value) {
    try { globalThis.localStorage?.setItem(this.key(name), JSON.stringify(value)); return value; }
    catch (error) { console.error(`Não foi possível salvar "${name}".`, error); throw new Error('Armazenamento local indisponível.'); }
  },
  has(name) { return globalThis.localStorage?.getItem(this.key(name)) !== null && globalThis.localStorage?.getItem(this.key(name)) !== undefined; },
  remove(name) { globalThis.localStorage?.removeItem(this.key(name)); },
  clear() {
    const prefix = `${APP_CONFIG.storagePrefix}:`;
    for (const key of Object.keys(globalThis.localStorage ?? {})) if (key.startsWith(prefix)) globalThis.localStorage.removeItem(key);
  },
});
