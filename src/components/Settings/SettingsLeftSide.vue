<template>
  <el-col
    :span="12"
    class="left_column fullheight"
  >
    <el-card
      :body-style="{ padding: '0' }"
      class="fullheight"
    >
      <div class="header">
        <span>Settings</span>
      </div>
      <div class="settings">
        <EthWalletItem :open-approval-dialog="openApprovalDialog" />
        <SecurityItem />
        <CurrencyItem />
        <TimeZoneItem />
      </div>
    </el-card>
  </el-col>
</template>

<script lang="ts">
import { lazyComponent } from '@/router'

import { Vue, Component } from 'vue-property-decorator'
import { Action } from 'vuex-class'

@Component({
  components: {
    SecurityItem: lazyComponent('Settings/components/Leftside/SecurityItem'),
    CurrencyItem: lazyComponent('Settings/components/Leftside/CurrencyItem'),
    EthWalletItem: lazyComponent('Settings/components/Leftside/EthWalletItem'),
    NetworkItem: lazyComponent('Settings/components/Leftside/NetworkItem'),
    TimeZoneItem: lazyComponent('Settings/components/Leftside/TimeZoneItem')
  }
})
export default class SettingsLeftSize extends Vue {
  @Action openApprovalDialog
}
</script>

<style scoped>
.header {
  padding: 1.5rem 1.5rem;
}

.settings {
  padding: 0 1.5rem;
}
</style>
