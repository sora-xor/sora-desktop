import { Vue, Component } from 'vue-property-decorator'

import ASSETS from '@/util/crypto-list.json'

const symbols = {
  USD: '$',
  RUB: '₽',
  EUR: '€'
}

@Component
export default class CurrencySymbol extends Vue {
  assetName (assetId) {
    const assetName = assetId.split('#')[0].toLowerCase()
    const asset = ASSETS.find(a => {
      return a.name.toLowerCase() === assetName || a.asset.toLowerCase() === assetName
    })
    return asset ? asset.asset : assetName
  }

  get currencySymbol () {
    const view = this.$store.getters.settingsView.fiat
    return symbols[view]
  }
}
