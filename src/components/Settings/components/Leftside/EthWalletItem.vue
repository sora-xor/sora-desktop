<template>
  <SettingsItem
    title="Ethereum account"
  >
    <el-row>
      <el-col v-if="!accountEthAddress.length">
        <sora-button
          :loading="isRegistering"
          label="Create wallet"
          @click="onCreateWallet"
        />
      </el-col>
      <el-col v-else>
        <div
          class="list-title"
        >
          Your ethereum address - {{ accountEthAddress }}
        </div>
      </el-col>
    </el-row>
  </SettingsItem>
</template>

<script lang="ts">
import { lazyComponent } from '@/router'
import FileSaver from 'file-saver'

import { Vue, Component, Prop, Mixins } from 'vue-property-decorator'
import { Action, Getter } from 'vuex-class'
import TransactionMixin from '@/components/mixins/transaction'
import mnemonicUtil from '@/util/mnemonic-util'
import { cache } from '@/util/iroha/util'

@Component({
  components: {
    SettingsItem: lazyComponent('Settings/components/Leftside/SettingsItem'),
    SoraButton: lazyComponent('UI/SoraButton')
  }
})
export default class EthWalletItem extends Mixins(
  TransactionMixin
) {
  isRegistering = false
  privateKey = ''

  @Action signUpWithEthereumWallet
  @Action updateAccount

  @Getter accountId
  @Getter irohaQuorum
  @Getter accountEthAddress

  async downloadTransaction () {
    let privateKey: string | undefined
    if (cache.mnemonic && cache.mnemonic.length) {
      privateKey = await mnemonicUtil.getEthereumKey(cache.mnemonic || '')
    }
    const { privateKey: pk, transaction } = await this.signUpWithEthereumWallet({
      accountId: this.accountId,
      irohaQuorum: this.irohaQuorum,
      privateKeys: [],
      ethPrivateKey: privateKey
    })
    this.privateKey = pk
    return transaction
  }

  successFunction () {
    const filename = `${this.accountId}-ethereum.priv`
    const blob = new Blob(
      [this.privateKey],
      { type: 'text/plain;charset=utf-8' }
    )
    FileSaver.saveAs(blob, filename)
  }

  async onCreateWallet () {
    this.isRegistering = true

    try {
      const tx = await this.downloadTransaction()
      await this.$sendTransaction(
        tx,
        this.successFunction
      )
      await this.updateAccount()
    } catch (error) {
      console.error(error)
      this.$message.error('Error! Please try again')
    }

    this.isRegistering = false
  }
}
</script>

<style scoped>
</style>
