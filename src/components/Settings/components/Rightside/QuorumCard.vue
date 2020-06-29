<template>
  <SettingsCard>
    <template slot="header">
      <span class="header_btn-title">
        Quorum: <b>{{ accountQuorum }}</b>
      </span>
    </template>
  </SettingsCard>
</template>

<script lang="ts">
import { mapGetters, mapActions } from 'vuex'
import { lazyComponent } from '@/router'

import { Vue, Component, Prop } from 'vue-property-decorator'
import { Action, Getter } from 'vuex-class'

@Component({
  components: {
    SettingsCard: lazyComponent('Settings/components/Rightside/SettingsCard')
  }
})
export default class QuorumCard extends Vue {
  @Prop(Function) readonly openApprovalDialog!: Function

  @Getter accountQuorum

  created () {
    this.getAccountQuorum()
  }

  @Action getAccountQuorum
}
</script>

<style>
</style>
