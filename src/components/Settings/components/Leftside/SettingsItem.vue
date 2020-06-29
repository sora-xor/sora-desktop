<template>
  <el-row class="settings_item">
    <div class="settings_item-header">
      <span class="settings_item-header-title">
        {{ title }}
      </span>
    </div>
    <div>
      <slot />
    </div>
  </el-row>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class SettingsItem extends Vue {
  @Prop({ default: 'Settings Item' }) readonly title!: string
}
</script>

<style>
.settings_item {
  margin-bottom: 20px;
}
.settings_item-header {
  margin-bottom: 15px;
}

.settings_item-header-title {
  font-size: 1rem;
  font-weight: 300;
}

.currencies_list {
  margin-bottom: 10px;
}

.currencies_list-select.el-radio {
  width: 5rem;
  height: 2.5rem;
  font-size: 1.1rem;
}

.list-title {
  font-size: 0.8rem;
  margin-bottom: 6px;
}
</style>
