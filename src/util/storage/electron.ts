import Store from 'electron-store'

const STORE = new Store({ name: 'keys' })

const set = (field, value) => STORE.set(field, value)

const get = field => STORE.get(field)

const has = field => STORE.has(field)

const clear = () => STORE.clear()

export default {
  set,
  get,
  has,
  clear
}
