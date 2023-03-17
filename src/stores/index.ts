// src/stores/index.js

import { store } from 'quasar/wrappers'
import { createPinia } from 'pinia'

export default store(() => {
  const pinia = createPinia()

  // You can add Pinia plugins here
  // pinia.use(SomePiniaPlugin)

  return pinia
})