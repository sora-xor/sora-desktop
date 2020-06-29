<template>
  <div class="sora-github-badge">
    <div class="sora-github-badge-steps">
      <span>
        <b>1.</b> Install OTS application
      </span>
      <span>
        <b>2.</b> Generate new key-pair
      </span>
    </div>
    <div class="sora-github-badge-logo">
      <a
        href="https://github.com/d3ledger/transaction-signer/releases/tag/v0.4.4"
        target="_blank"
      >
        <img src="@/assets/Github.svg">
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class SoraGithubBadge extends Vue {
}
</script>

<style scoped>
.sora-github-badge {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 0.5rem 1.5rem;
  background-color: #E9E9E9;
}
.sora-github-badge > .sora-github-badge-steps {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  font-size: 0.9rem;
}
.sora-github-badge > .sora-github-badge-logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}
</style>
