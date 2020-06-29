<template>
  <div class="update_block">
    <img
      class="update_block-logo"
      src="@/assets/logo.svg"
    >
    <p class="update_block-msg">
      {{ msg }}
    </p>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'

@Component
export default class UpdatePage extends Vue {
  created () {
    ipcRenderer.send('UPDATE_CHECK')
    ipcRenderer.on('MESSAGE', (_, args) => (this.msg = args))
    ipcRenderer.on('UPDATE_DONE', this.beforeCloseWindow)
  }

  msg = 'Checking for updates...'

  beforeCloseWindow () {
    this.msg = 'Starting...'
    setTimeout(() => {
      ipcRenderer.send('START_APP')
    }, 2 * 1000)
  }
}
</script>

<style scoped>
@font-face {
  font-family: "SoraSB";
  src: url("../../assets/fonts/Sora-SemiBold.otf");
  font-weight: normal;
  font-style: normal;
}
.update_block {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.update_block-logo {
  width: 100px;
}
.update_block-msg {
  font-family: 'SoraSB';
  color: #ffffff;
  margin-top: 1rem;
}
</style>
