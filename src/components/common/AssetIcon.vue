<template>
  <div>
    <img
      v-if="isAvaliable"
      :style="{'height': size + 'px'}"
      :src="require(`@/assets/icons/coins/${asset}.png`)"
    >
    <img
      v-else
      :style="{width: size + 'px'}"
      src="@/assets/icons/coins/default.svg"
    >
  </div>
</template>

<script lang="ts">
// TODO: Find better solution to show icons of assets
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class AssetIcon extends Vue {
  @Prop(String) readonly asset: string | undefined
  @Prop({ default: 24 }) readonly size!: number

  assets = [
    'USD',
    'JPY',
    'CHF',
    'RUB',
    'QAR',
    'DKK',
    'NOK',
    'XDR',
    'XAU',
    'XOR',
    'ETH'
  ]

  get isAvaliable () {
    if (!this.asset) return false
    return this.assets.includes(
      this.asset.toUpperCase()
    )
  }
}
</script>
