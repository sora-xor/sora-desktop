<template>
  <el-main class="column-fullheight card-wrapper flex-direction-row">
    <el-card
      v-if="!accountEthAddress.length"
      class="card"
    >
      You don't have Ethereum wallet yet. Please add walet in <span
        class="monospace bold clickable"
        @click="goToSettings"
      >Settings</span>
    </el-card>
    <el-card
      v-if="accountEthAddress.length"
      class="card"
    >
      <div
        class="deposit-address"
      >
        <div
          v-if="!accountEthAddress.length"
          class="deposit-address-transfer"
        >
          <p class="deposit-address-transfer_desc">
            Please register your Ethereum wallet in <span
              class="monospace bold clickable"
              @click="goToSettings"
            >Settings</span>
          </p>
        </div>
        <div
          v-else
          class="deposit-address-transfer"
        >
          <p class="deposit-address-transfer_desc">
            Transfer your ETH / ERC20 tokens from your account
          </p>
          <p
            class="deposit-address-transfer_address"
            @click="$doCopy(accountEthAddress)"
          >
            {{ accountEthAddress }}
          </p>
          <p class="deposit-address-transfer_desc">
            to smart contract
          </p>
          <p
            class="deposit-address-transfer_address"
            @click="$doCopy(ethMasterContractAddress)"
          >
            {{ ethMasterContractAddress }}
          </p>
        </div>
      </div>
    </el-card>
  </el-main>
</template>

<script lang="ts">
import { Vue, Component, Mixins } from 'vue-property-decorator'
import { State, Getter } from 'vuex-class'
import find from 'lodash/fp/find'

import ClipboardMixin from '@/components/mixins/clipboard'

@Component
export default class NoAssetsCard extends Mixins(
  ClipboardMixin
) {
  @State(state => state.Account.accountId) accountId

  @Getter ethMasterContractAddress
  @Getter accountEthAddress

  goToSettings () {
    this.$router.push('/settings')
  }
}
</script>

<style scoped>
.card-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}
.card {
  max-width: 600px;
}
</style>
