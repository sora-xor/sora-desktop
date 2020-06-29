<template>
  <div class="sora-select">
    <p class="sora-select-label">
      {{ label }}
    </p>
    <el-select
      v-model="variable.$model"
      :disabled="disabled"
      :class="[
        _isValid(variable) ? 'border_success' : '',
        _isError(variable) ? 'border_fail' : ''
      ]"
      :filterable="filterable"
      :allow-create="allowCreate"
      popper-class="sora-select-dropdown"
      @change="onChange"
    >
      <slot name="options" />
    </el-select>
    <span
      v-show="_isError(variable)"
      class="sora-select-error"
    >
      {{ _showError(variable) }}
    </span>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins, PropSync } from 'vue-property-decorator'
import { ErrorHandler } from '@/components/mixins/validation'

@Component
export default class SoraSelect extends Mixins(ErrorHandler) {
  @Prop() readonly variable!: any
  @Prop(String) readonly label!: string
  @Prop(Boolean) readonly disabled!: boolean
  @Prop({ default: false }) readonly filterable!: boolean
  @Prop({ default: false }) readonly allowCreate!: boolean

  onChange (v) {
    this.$emit('change', v)
  }
}
</script>

<style scoped>
.sora-select {
  padding: 0rem 1.5rem;
  display: flex;
  flex-direction: column;
}
.sora-select > .sora-select-label {
  font-size: 0.95rem;
}
.sora-select > .sora-select-container {
  display: flex;
  flex-direction: row;
}
.sora-select >>> .is-focus .el-input__inner {
  border: 0.5px solid rgba(0, 0, 0, 0.2);
}
.sora-select >>> .el-input__inner {
  flex: 2;
  height: 3rem;
  border: 0.5px solid rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  line-height: 2;
}
.sora-select >>> .border_success .el-input__inner {
  border: 1px solid #000000;
}
.sora-select >>> .border_fail .el-input__inner  {
  border: 1px solid #d0021b;
}
.sora-select > .sora-select-error {
  color: #d0021b;
  font-size: 0.8rem;
  line-height: 1.5rem;
}
</style>

<style>
.sora-select-dropdown {
  margin-top: 5px;
  border-radius: 10px;
  border: 0.5px solid rgba(0, 0, 0, 1);
}
.sora-select-dropdown .el-select-dropdown__item {
  display: flex;
  justify-content: space-between;
}
.sora-select-dropdown .el-select-dropdown__item.hover {
  background-color: inherit;
  font-family: 'SoraB' !important;
}
.sora-select-dropdown .el-select-dropdown__item.selected {
  color: #000000;
  font-family: 'SoraB' !important;
}
.sora-select-dropdown .popper__arrow {
  display: none;
}
</style>
