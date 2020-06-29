<template>
  <div class="sora-input-btn">
    <sora-input
      :variable="variable"
      :disabled="disabled"
      :name="name"
      :placeholder="placeholder"
      :label="label"
      :type="type"
    >
      <template slot="btn">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          :on-change="onFileChosen"
          :disabled="disabled"
          :accept="accept"
          :class="[
            'sora-input-btn-button',
            _isValid(variable) ? 'border_success' : '',
            _isError(variable) ? 'border_fail' : ''
          ]"
          action=""
        >
          <el-button class="sora-input-btn-label">
            <img
              src="@/assets/icons/download.svg"
              alt=""
              srcset=""
            >
            <p>From file...</p>
          </el-button>
        </el-upload>
      </template>
    </sora-input>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins } from 'vue-property-decorator'
import { ErrorHandler } from '@/components/mixins/validation'
import { lazyComponent } from '@/router'

@Component({
  components: {
    SoraInput: lazyComponent('UI/SoraInput')
  }
})
export default class SoraInputWithButton extends Mixins(ErrorHandler) {
  @Prop() readonly variable!: any
  @Prop(String) readonly name!: string
  @Prop(String) readonly placeholder!: string
  @Prop(String) readonly label!: string
  @Prop(Boolean) readonly disabled!: boolean
  @Prop(String) readonly type!: string
  @Prop({ default: '' }) readonly accept!: string

  onInput (v) {
    this.$emit('input', v)
  }

  onFileChosen (v) {
    this.$emit('file', v)
  }
}
</script>

<style scoped>
.sora-input-btn >>> .el-button {
  border: 1px solid rgba(0, 0, 0, 1);
  border-radius: 10px;
}
.sora-input-btn >>> .sora-input-btn-button {
  margin-left: -2rem;
  z-index: 1;
}
.sora-input-btn .sora-input-btn-label {
  height: 3rem;
  padding: 0.5rem 1rem;
}
.sora-input-btn .sora-input-btn-label >>> span {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #000000;
}
.sora-input-btn .sora-input-btn-label >>> span > img {
  margin-right: 0.5rem;
}
</style>
