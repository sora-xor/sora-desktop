<template>
  <SettingsItem
    :v-slot="{ currentCrypto, currentFiat }"
    title="Currency"
  >
    <el-row class="currencies_list">
      <p class="list-title">
        Dashboard (Portfolio, Market, Balance and Changes)
      </p>
      <el-col>
        <el-radio-group
          v-model="currentFiat"
          size="small"
        >
          <el-radio
            v-for="(value, index) in settingsFiatCurrencies"
            :key="index"
            :label="value"
            class="currencies_list-select"
            border
          >
            {{ value }}
          </el-radio>
        </el-radio-group>
      </el-col>
    </el-row>
    <el-row
      v-show="false"
      class="currencies_list"
    >
      <p class="list-title">
        Wallets (Market)
      </p>
      <el-col>
        <el-radio-group
          v-model="currentCrypto"
          size="small"
        >
          <el-radio
            v-for="(value, index) in settingsCryptoCurrencies"
            :key="index"
            :label="value"
            class="currencies_list-select"
            border
          >
            {{ value }}
          </el-radio>
        </el-radio-group>
      </el-col>
    </el-row>
  </SettingsItem>
</template>

<script lang="ts">
import { lazyComponent } from '@/router'

import { Vue, Component } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'

@Component({
  components: {
    SettingsItem: lazyComponent('Settings/components/Leftside/SettingsItem')
  }
})
export default class CurrencyItem extends Vue {
  @Getter settingsView
  @Getter settingsFiatCurrencies
  @Getter settingsCryptoCurrencies

  get currentFiat () {
    return this.settingsView.fiat
  }
  set currentFiat (value) {
    this.updateSettingsViewFiat(value)
  }

  get currentCrypto () {
    return this.settingsView.crypto
  }
  set currentCrypto (value) {
    this.updateSettingsViewCrypto(value)
  }

  @Action updateSettingsViewFiat
  @Action updateSettingsViewCrypto
}
</script>

<style scoped>
.currencies_list-select.is-checked {
  border-color: #000000;
}
.currencies_list-select.is-checked >>> .el-radio__inner {
  border-color: #000000;
  background-color: #000000;
}
.currencies_list-select.is-checked >>> .el-radio__label {
  color: #000000;
}
</style>
