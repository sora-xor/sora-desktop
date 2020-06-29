<template>
  <el-col
    :span="12"
    class="right_column fullheight"
  >
    <QuorumCard
      :open-approval-dialog="openApprovalDialog"
    />
    <PublicKeysCard
      :active-tab="activeTab"
      :update-active-tab="updateActiveTab"
      :open-approval-dialog="openApprovalDialog"
    />
    <CustomTxCard
      :active-tab="activeTab"
      :update-active-tab="updateActiveTab"
    />
  </el-col>
</template>

<script lang="ts">
import { lazyComponent } from '@/router'

import { WalletTypes } from '@/data/consts'

import { Vue, Component } from 'vue-property-decorator'
import { Action } from 'vuex-class'

const settingsRightSidePath = 'Settings/components/Rightside'

@Component({
  components: {
    QuorumCard: lazyComponent(`${settingsRightSidePath}/QuorumCard`),
    PublicKeysCard: lazyComponent(`${settingsRightSidePath}/PublicKeysCard`),
    WhiteListCard: lazyComponent(`${settingsRightSidePath}/WhiteListCard`),
    CustomTxCard: lazyComponent(`${settingsRightSidePath}/CustomTxCard`)
  }
})
export default class SettingsRightSize extends Vue {
  WalletTypes = WalletTypes
  activeTab = 1

  @Action openApprovalDialog

  updateActiveTab (id) {
    this.activeTab = id
  }
}
</script>

<style scoped>
</style>
