<template>
  <el-dialog
    :visible="isVisible"
    data-cy="depositModal"
    title="Deposit"
    width="470px"
    center
    @close="close"
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
          Transfer your {{ wallet.asset }} tokens from your account
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
    <sora-button
      label="Okay"
      type="secondary"
      style="padding: 0.5rem;"
      @click="close"
    />
  </el-dialog>
</template>

<script lang="ts">
import { mapGetters } from 'vuex'

import { Vue, Component, Prop, Mixins } from 'vue-property-decorator'
import { Getter, State } from 'vuex-class'
import find from 'lodash/fp/find'
import { lazyComponent } from '@/router'
import ClipboardMixin from '@/components/mixins/clipboard'

interface Wallet {
  assetId: string;
  asset: string;
}

@Component({
  components: {
    SoraButton: lazyComponent('UI/SoraButton')
  }
})
export default class DepositModal extends Mixins(
  ClipboardMixin
) {
  @Prop({ default: false }) readonly isVisible!: boolean
  @Prop(Object) readonly wallet!: Wallet

  @Getter ethMasterContractAddress
  @Getter accountId
  @Getter accountEthAddress

  goToSettings () {
    this.$router.push('/settings')
  }

  close () {
    this.$emit('update:isVisible', false)
  }
}
</script>

<style>
</style>
