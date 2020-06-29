<template>
  <el-container>
    <Menu :quorum="accountQuorum" />
    <el-main style="width: 100%; min-height: 100vh; padding: 0; padding-left: 160px;">
      <router-view />
    </el-main>
    <confirm-modal />
    <confirm-eth-modal />
    <upload-transaction-modal />
    <password-modal />
  </el-container>
</template>

<script lang="ts">
import { lazyComponent } from '@/router'

import { Vue, Component, Mixins } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import IdleHandler from '@/components/Security/IdleHandler'

@Component({
  components: {
    Menu: lazyComponent('Home/Menu'),
    ConfirmModal: lazyComponent('common/modals/ConfirmModal'),
    UploadTransactionModal: lazyComponent('common/modals/UploadTransactionModal'),
    ConfirmEthModal: lazyComponent('common/modals/ConfirmEthModal'),
    PasswordModal: lazyComponent('common/modals/PasswordModal')
  }
})
export default class Home extends Mixins(
  IdleHandler
) {
  @Getter accountQuorum

  created () {
    this.getAllUnsignedTransactions()
    this.getMasterContractAddress()
  }

  mounted () {
    document.documentElement.style.setProperty('--show-loading', 'none')
  }

  @Action getAllUnsignedTransactions
  @Action getMasterContractAddress
}
</script>

<style>
</style>
