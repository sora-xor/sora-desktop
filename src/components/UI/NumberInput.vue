<template>
  <div class="sora-input-num">
    <p class="sora-input-num-label">
      {{ label }}
    </p>
    <div class="sora-input-num-container">
      <el-input
        v-numeric
        :value="maskedInput"
        :class="[
          _isValid(variable) ? 'border_success' : '',
          _isError(variable) ? 'border_fail' : ''
        ]"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="onInput"
      />
    </div>
    <span
      v-show="_isError(variable)"
      class="sora-input-num-error"
    >
      {{ _showError(variable) }}
    </span>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch, Mixins } from 'vue-property-decorator'
import { ErrorHandler } from '@/components/mixins/validation'
import isNull from 'lodash/isNull'
import BigNumber from 'bignumber.js'
import numbro from 'numbro'

@Component
export default class NumberInput extends Mixins(
  ErrorHandler
) {
  @Prop() readonly variable!: any
  @Prop(String) readonly name!: string
  @Prop({ default: '0' }) readonly placeholder!: string
  @Prop(String) readonly label!: string
  @Prop(Boolean) readonly disabled!: boolean

  maskedInput = ''

  @Watch('variable', { deep: true })
  watchVariable (val: any) {
    const isValueNull = isNull(val.$model)

    if (isValueNull) {
      this.maskedInput = ''
    }

    if (!isValueNull && typeof val.$model === 'string') {
      const mask = this.setMask(val.$model)
      if (this.maskedInput === mask) return

      this.maskedInput = mask
    }
  }

  onInput (value) {
    const raw = this.unMask(value)
    if (raw.includes('.')) {
      const [beforeDot, afterDot] = raw.split('.')
      this.$emit('input', `${beforeDot}.${afterDot.substring(0, 18)}`)
    } else {
      this.$emit('input', raw)
    }
  }

  setMask (value) {
    let result = ''
    const pattern = /(\d)(?=(\d{3})+(?!\d))/g
    const isDotExist = value.includes('.')
    const [beforeDot, afterDot] = value.split('.')
    const limitedAfterDot = afterDot ? afterDot.substring(0, 18) : ''

    result += beforeDot.replace(pattern, '$1 ')

    if (isDotExist) {
      result += `.${limitedAfterDot}`
    }

    return result
  }

  unMask (value: string) {
    const pattern = /\s/g
    return value.replace(pattern, '')
  }
}
</script>

<style scoped>
.sora-input-num {
  padding: 0rem 1.5rem;
  display: flex;
  flex-direction: column;
}
.sora-input-num > .sora-input-num-label {
  font-size: 0.95rem;
}
.sora-input-num > .sora-input-num-container {
  display: flex;
  flex-direction: row;
}
.sora-input-num >>> .el-input__inner {
  flex: 2;
  height: 3rem;
  border: 0.5px solid rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}
.sora-input-num >>> .border_success .el-input__inner {
  border: 1px solid #000000;
}
.sora-input-num >>> .border_fail .el-input__inner  {
  border: 1px solid #d0021b;
}
.sora-input-num > .sora-input-num-error {
  color: #d0021b;
  font-size: 0.8rem;
  line-height: 1.5rem;
}
</style>
