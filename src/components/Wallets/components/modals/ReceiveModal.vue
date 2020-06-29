<template>
  <el-dialog
    :visible="isVisible"
    data-cy="receiveModal"
    title="Receive"
    width="470px"
    center
    @close="close"
  >
    <div
      class="deposit-address"
    >
      <div
        class="deposit-address-transfer"
      >
        <div>
          <p>Wait until someone transfers {{ wallet.asset }} to your account</p>
          <p
            class="deposit-address-transfer_address"
            @click="$doCopy(accountId)"
          >
            {{ accountId }}
          </p>
          <qrcode-vue
            :value="accountId"
            :size="270"
          />
        </div>
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
import QrcodeVue from 'qrcode.vue'
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
    QrcodeVue,
    SoraButton: lazyComponent('UI/SoraButton')
  }
})
export default class ReceiveModal extends Mixins(
  ClipboardMixin
) {
  @Prop({ default: false }) readonly isVisible!: boolean
  @Prop(Object) readonly wallet!: Wallet

  @Getter accountId

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
