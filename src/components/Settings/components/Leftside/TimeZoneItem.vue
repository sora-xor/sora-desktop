<template>
  <SettingsItem
    :v-slot="{ currentZone }"
    title="Time zone"
  >
    <el-row>
      <el-col>
        <sora-select
          id="timezone_select"
          class="fullwidth"
          :filterable="true"
          placeholder="Select"
          :variable="$v.currentZone"
          @change="v => currentZone = v"
        >
          <template slot="options">
            <el-option
              v-for="(zone, index) in timezones"
              :key="index"
              :label="zone"
              :value="zone"
            />
          </template>
        </sora-select>
      </el-col>
    </el-row>
  </SettingsItem>
</template>

<script lang="ts">
import DateFormat from '@/components/mixins/dateFormat'

import { lazyComponent } from '@/router'

import { Vue, Component, Mixins } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'

@Component({
  components: {
    SettingsItem: lazyComponent('Settings/components/Leftside/SettingsItem'),
    SoraSelect: lazyComponent('UI/SoraSelect')
  }
})
export default class TimezoneItem extends Mixins(
  DateFormat
) {
  validations () {
    return {
      currentZone: ''
    }
  }

  @Getter settingsView

  get currentZone () {
    return this.settingsView.timezone
  }
  set currentZone (value) {
    this.updateSettingsViewTime(value)
  }

  @Action updateSettingsViewTime
}
</script>

<style scoped>
</style>
