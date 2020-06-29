<template>
  <div>
    <div
      v-for="(c, i) of commands"
      :key="i"
      :class="[
        'transaction_details',
        i % 2 === 0 ? 'grey' : ''
      ]"
      :set="cc = getCommand(c)"
    >
      <div
        class="left"
      >
        <p><b>{{ cc.type === CommandType.transferAsset ? 'TRANSFER' : c[cc.type].type }}</b></p>
      </div>
      <template v-if="cc.type === CommandType.transferAsset">
        <div class="labels">
          <p><span class="label">From:</span> {{ c[cc.type].from }}</p>
          <p><span class="label">To:</span> {{ c[cc.type].to }}</p>
          <p><span class="label">Amount:</span> {{ c[cc.type].sign }}{{ c[cc.type].amount | formatPrecision }} {{ assetName(c[cc.type].assetId) }}</p>
          <p v-if="c[cc.type].type !== 'WITHDRAWAL'">
            <span class="label">Message:</span> {{ getMessage(c[cc.type].type, c[cc.type].message) }}
          </p>
        </div>
      </template>
      <template v-else>
        <div>
          <p><span class="label">Amount:</span> {{ c[cc.type].sign }}{{ c[cc.type].amount | formatPrecision }} {{ cc.type === CommandType.subtractAssetQuantity ? 'XOR' : assetName(c[cc.type].assetId) }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins } from 'vue-property-decorator'

import numberFormat from '@/components/mixins/numberFormat'
import currencySymbol from '@/components/mixins/currencySymbol'
import { Getter } from 'vuex-class'

enum CommandType {
  transferAsset = 'transferAsset',
  addAssetQuantity = 'addAssetQuantity',
  subtractAssetQuantity = 'subtractAssetQuantity'
}

@Component
export default class HistoryTableItem extends Mixins(
  numberFormat,
  currencySymbol
) {
  @Prop(Array) readonly commands!: any[]
  @Prop(String) readonly asset!: string
  CommandType = CommandType

  getCommand (command) {
    if (command.transferAsset) {
      return {
        type: this.CommandType.transferAsset
      }
    }
    if (command.addAssetQuantity) {
      return {
        type: this.CommandType.addAssetQuantity
      }
    }
    if (command.subtractAssetQuantity) {
      return {
        type: this.CommandType.subtractAssetQuantity
      }
    }
  }

  getMessage (type, message) {
    if (type === 'WITHDRAWAL') {
      return `Withdraw to Ethereum address: ${message}`
    }
    if (type === 'EXCHANGE') {
      const assetName = message.split('#')[0]
      return `Conversion from ${this.asset} to ${assetName.toUpperCase()}`
    }
    return message
  }
}
</script>

<style class="scoped">
.transaction_details {
  display: flex;
  flex-direction: row;
  font-size: 0.8rem;
  color: #000000;
  background-color: #ffffff;
  padding: 1rem;
  min-height: 5rem;
}
.transaction_details.grey {
  background-color: #f4f4f4;
}
.transaction_details .left {
  display: flex;
  align-items: center;
  margin-right: 1rem;
  font-size: 0.6rem;
  text-transform: uppercase;
  min-width: 5rem;
}
.transaction_details .labels {
  display: flex;
  justify-content: center;
  flex-direction: column;
}
.transaction_details .label {
  font-weight: 600;
  min-width: 5rem;
  display: inline-block;
}
</style>
