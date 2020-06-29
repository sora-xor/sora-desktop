<template>
  <SettingsCard>
    <template slot="header">
      <span
        class="header_btn-title pointed"
        @click="updateActiveTab(5)"
      >
        <span class="header_btn-icon_block">
          <fa-icon
            :icon="activeTab === 5 ? 'angle-down' : 'angle-right'"
            class="header_btn-icon"
          />
        </span>
        Send custom transaction
      </span>
    </template>
    <template slot="content">
      <div v-if="activeTab === 5">
        <div
          class="settings-item"
        >
          <upload-tx
            :on-complete="onComplete"
          />
        </div>
      </div>
    </template>
  </SettingsCard>
</template>

<script lang="ts">
import { lazyComponent } from '@/router'

import { Vue, Component, Prop } from 'vue-property-decorator'

@Component({
  components: {
    SettingsCard: lazyComponent('Settings/components/Rightside/SettingsCard'),
    UploadTx: lazyComponent('common/UploadTx')
  }
})
export default class CustomTxCard extends Vue {
  @Prop(Number) readonly activeTab!: number
  @Prop(Function) readonly updateActiveTab!: (id: number) => void

  onComplete ({ status }) {
    if (status === 1) {
      this.$message.success('Success! Transaction sent!')
    }
  }
}
</script>

<style>
</style>
