<template>
  <div class="sora-steps">
    <div
      class="sora-steps-inner"
      :style="{
        width: `${value}%`
      }"
    />
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class SoraSteps extends Vue {
  @Prop({ default: 0 }) readonly value!: number
}
</script>

<style scoped>
.sora-steps {
  width: 100%;
  height: 5px;
  background-color: #e5e5e5;
  margin-top: -1px;
}
.sora-steps-inner {
  height: 5px;
  background-color: #42A1F4;
}
</style>
