<template>
  <svg
    :width="width"
    :height="height"
    :aria-labelledby="iconName"
    :class="iconClass"
    xmlns="http://www.w3.org/2000/svg"
    role="presentation"
  >
    <title
      :id="iconName"
      lang="en"
    >{{ iconName }} icon</title>
    <g :fill="iconColor">
      <slot />
    </g>
  </svg>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class SvgIcon extends Vue {
  @Prop({ default: 'box' }) readonly iconName!: string
  @Prop({ default: 24 }) readonly width!: number
  @Prop({ default: 24 }) readonly height!: number
  @Prop({ default: 'currentColor' }) readonly iconColor!: string
  @Prop({ default: '' }) readonly iconClass!: string
}
</script>

<style scoped>
</style>
