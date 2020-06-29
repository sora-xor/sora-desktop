<template>
  <div class="sora-button">
    <el-button
      :class="['fullwidth', buttonTypeClass]"
      :loading="loading"
      :disabled="disabled"
      @click="onClick"
    >
      {{ label }}
    </el-button>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class SoraButton extends Vue {
  @Prop(Boolean) readonly loading!: boolean
  @Prop({ default: false }) readonly disabled!: boolean
  @Prop({ default: 'button' }) readonly label!: string
  @Prop({ default: 'primary' }) readonly type!: string

  get buttonTypeClass () {
    if (this.type === 'primary') return 'sora-button-primary'
    if (this.type === 'plain') return 'sora-button-plain'
    if (this.type === 'blue') return 'sora-button-blue'
    if (this.type === 'red') return 'sora-button-red'
    return 'sora-button-secondary'
  }

  onClick (v) {
    this.$emit('click', v)
  }
}
</script>

<style scoped>
.sora-button {
  padding: 0 1.5rem;
}
.sora-button .el-button {
  border-radius: 10px;
  min-height: 3rem;
  font-size: 0.8rem;
}
.sora-button .sora-button-primary {
  color: #ffffff;
  background-color: #000000;
  border-color: #000000;
}
.sora-button .sora-button-plain {
  color: #000000;
  background-color: #ffffff;
  border-color: #000000;
}
.sora-button .sora-button-secondary {
  color: #000000;
  background-color: #F2F2F2;
  border-color: #F2F2F2;
}
.sora-button .sora-button-blue {
  color: #ffffff;
  background-color: #1B8BFF;
  border-color: #1B8BFF;
}
.sora-button .sora-button-red {
  color: #ffffff;
  background-color: #D0021B;
  border-color: #D0021B;
}
</style>
