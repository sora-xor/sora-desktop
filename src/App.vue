<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts">
import debounce from 'lodash/debounce'
import { mapState, mapActions } from 'vuex'

import { Vue, Component, Watch } from 'vue-property-decorator'
import { State, Action } from 'vuex-class'

@Component
export default class App extends Vue {
  async created () {
    await this.loadConfiguration()
    await this.loadSettings()
  }

  @State(state => state.Account.connectionError) connectionError

  @Watch('connectionError')
  watchConnectionError (to) {
    if (to) this.showConnectionErrorMessage()
  }

  @Action loadConfiguration
  @Action loadSettings

  showConnectionErrorMessage () {
    return debounce(function (this: any) {
      this.$message.error(`connection error: Please check IP address OR your internet connection`)
    }, 1000)
  }
}
</script>

<style>
@font-face {
  font-family: "SoraB";
  src: url("./assets/fonts/Sora-Bold.otf");
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: "SoraEB";
  src: url("./assets/fonts/Sora-ExtraBold.otf");
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: "SoraSB";
  src: url("./assets/fonts/Sora-SemiBold.otf");
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: "Sora";
  src: url("./assets/fonts/Sora-Regular.otf");
  font-weight: normal;
  font-style: normal;
}

html {
  box-sizing: border-box;
}

*, *:before, *:after {
  box-sizing: border-box;
  margin: 0;
}

.el-icon {
  font-family: element-icons !important;
}

[class^="el-"]:not(i):not([class*='el-icon']),
[class*="el-"]:not(i):not([class*='el-icon']) {
  font-family: 'Sora', sans-serif !important;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  background: #000000;
}

a {
  color: black;
  transition: opacity .15s ease-in-out;
  cursor: pointer;
  text-decoration: none;
}

a:hover {
  opacity: 0.8;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  opacity: 0.8;
}

.column-fullheight {
  min-height: 100vh;
  overflow: auto;
}

.flex-direction-row {
  flex-direction: row;
}

.form-item-text {
  font-size: 14px;
  opacity: 0.7;
}

.form-item-text-amount {
  font-weight: bold;
}

.black.el-button {
  color: white;
  background: #000000;
  border: 1px solid #000000;
}

.black.el-button:hover {
  color: white;
  background: #36464D;
  border: 1px solid #36464D;
}

.monospace {
  font-family: 'Sora', sans-serif;
}

.bold {
  font-weight: bold;
}

.fullheight {
  height: 100%;
}

.fullwidth {
  width: 100%;
}

.pointed {
  cursor: pointer;
}

.clear_padding {
  padding: 0 !important;
}

.text-overflow {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.last-button {
  padding-bottom: 1rem !important;
}

#app .disabled {
  cursor: not-allowed;
}

/*
 * Login and SignUp pages
 */
.flex-center {
  display: flex;
  flex-direction: column !important;
  align-items: center;
  min-height: 100vh;
}

.auth-container {
  background-color: #ffffff;
  border-radius: 0.8rem;
  width: 30vw;
  margin-bottom: 1rem;
}

.auth-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom: 1px solid #ebebeb;
  font-size: 0.9rem;
}

.auth-header_logo {
  padding: 2rem;
}

.auth-header_title {
  font-size: 1.3rem;
  font-weight: 500;
  color: #000000;
  margin: 1rem 0;
}

.auth-header_subtitle {
  font-size: 0.7rem;
  font-weight: 500;
  color: #000000;
  margin: -0.5rem 2rem 0.5rem 2rem;
  text-align: center;
}

.auth-form-last-item {
  text-align: center;
  margin-bottom: 1rem !important;
}

.auth-form-last-item_btn {
  margin-bottom: 1rem;
}

#app .el-form-item {
  margin-bottom: 0rem;
  min-height: 7rem;
}

#app .el-main {
  padding: 0;
}

#app .el-dialog {
  border-radius: 10px;
}
#app .el-dialog__header {
  border-bottom: 0.5px solid #e5e5e5;
  height: 4rem;
  font-weight: 600;
}
#app .el-dialog__body {
  color: #000000;
  padding: 0;
}
#app .el-dialog__body .modal-action {
  padding-bottom: 0.8rem;
}
#app .el-dialog .el-dialog__headerbtn {
  display: none;
}
#app .el-upload-dragger {
  border-color: #e5e5e5;
}
#app .el-upload-dragger:hover,
#app .el-upload-dragger:focus,
#app .el-upload-dragger:active {
  border-color: #000000;
}

/* DEPOSIT-MODAL */
.deposit-address {
  padding: 1rem;
  text-align: center;
}
.deposit-address .deposit-address-transfer_address {
  color: #1B8BFF;
  font-weight: 600;
  margin: 0.5rem 0;
  cursor: pointer;
}
.deposit-address-separator {
    display: flex;
    align-items: center;
    text-align: center;
    color: rgba(0, 0, 0, 0.5);
    margin: 1rem 1rem;
}
.deposit-address-separator::before, .deposit-address-separator::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid rgba(0, 0, 0, 0.25);
}
.deposit-address-separator::before {
    margin-right: 1em;
}
.deposit-address-separator::after {
    margin-left: 1em;
}
/* DEPOSIT-MODAL */

/* BLUE ARROW */

.blue_arrow.up {
  transform: rotate(-90deg);
}
.blue_arrow.down {
  transform: rotate(90deg);

}
.blue_arrow.left {
  transform: rotate(180deg);

}
.blue_arrow.right {
  transform: rotate(0deg);
}
/* BLUE ARROW */

/* SPINNER ICON */
.timer-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 20rem;
}
.timer-spinner-icon {
  animation: spin 1s ease-in-out 0s infinite;
}
.timer-spinner-countdown {
  padding-top: 1rem;
  font-size: 1.1rem;
  color: rgba(0, 0, 0, 0.5);
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
