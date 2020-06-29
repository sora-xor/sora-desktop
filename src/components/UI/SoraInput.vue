<template>
  <div class="sora-input">
    <p class="sora-input-label">
      {{ label }}
    </p>
    <div class="sora-input-container">
      <el-input
        v-model="variable.$model"
        :disabled="disabled"
        :class="[
          'sora-input-el',
          _isValid(variable) ? 'border_success' : '',
          _isError(variable) ? 'border_fail' : ''
        ]"
        :name="name"
        :placeholder="placeholder"
        :type="type"
        :rows="rows"
        @input="onInput"
      />
      <slot name="btn" />
    </div>
    <span
      v-show="_isError(variable)"
      class="sora-input-error"
    >
      {{ _showError(variable) }}
    </span>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins, PropSync } from 'vue-property-decorator'
import { ErrorHandler } from '@/components/mixins/validation'

@Component
export default class SoraInput extends Mixins(ErrorHandler) {
  @Prop() readonly variable!: any
  @Prop(String) readonly name!: string
  @Prop(String) readonly placeholder!: string
  @Prop(String) readonly label!: string
  @Prop(Boolean) readonly disabled!: boolean
  @Prop({ default: 'text' }) readonly type!: string
  @Prop({ default: 0 }) readonly rows!: number

  onInput (v) {
    this.$emit('input', v)
  }
}
</script>

<style scoped>
.sora-input {
  padding: 0rem 1.5rem;
  display: flex;
  flex-direction: column;
}
.sora-input > .sora-input-label {
  font-size: 0.95rem;
}
.sora-input > .sora-input-container {
  display: flex;
  flex-direction: row;
}
.sora-input >>> .el-input__inner {
  flex: 2;
  height: 3rem;
  border: 0.5px solid rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  line-height: 2;
}
.sora-input >>> .el-textarea__inner {
  flex: 2;
  /* min-height: 3rem; */
  /* height: 3rem; */
  border: 0.5px solid rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  line-height: 2;
}
.sora-input >>> .border_success .el-input__inner,
.sora-input >>> .border_fail .el-textarea__inner {
  border: 1px solid #000000;
}
.sora-input >>> .border_fail .el-input__inner,
.sora-input >>> .border_fail .el-textarea__inner {
  border: 1px solid #d0021b;
}
.sora-input > .sora-input-error {
  color: #d0021b;
  font-size: 0.8rem;
  line-height: 1.5rem;
}
</style>
