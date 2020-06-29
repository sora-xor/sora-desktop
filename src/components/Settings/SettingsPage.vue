<template>
  <el-container class="fullheight">
    <el-main class="fullheight">
      <el-row class="container_flex fullheight">
        <SettingsLeftSide />
        <SettingsRightSide />
      </el-row>
    </el-main>
  </el-container>
</template>

<script lang="ts">
import { lazyComponent } from '@/router'

import { Vue, Component } from 'vue-property-decorator'
import { Action } from 'vuex-class'

@Component({
  components: {
    SettingsLeftSide: lazyComponent('Settings/SettingsLeftSide'),
    SettingsRightSide: lazyComponent('Settings/SettingsRightSide')
  }
})
export default class SettingsPage extends Vue {
  created () {
    this.updateAccount()
  }

  @Action updateAccount
}
</script>

<style scoped>
.container_flex {
  display: flex;
  justify-content: space-between;
}

.left_column {
  margin-right: 0.5rem;
}

.right_column {
  display: flex;
  flex-direction: column;
}
</style>

<style scope>

</style>
