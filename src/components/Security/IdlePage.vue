<template>
  <el-container class="flex-center">
    <img
      src="@/assets/Sora.svg"
      alt="SoraNet"
      class="auth-header_logo"
    >
    <div class="auth-container">
      <div class="auth-header">
        <span class="auth-header_title">Welcome back!</span>
      </div>
      <div class="auth-form-container">
        <el-form
          ref="form"
          :model="form"
          class="auth-form"
          label-position="top"
          @submit.prevent.native="onSubmit"
        >
          <div
            v-if="isIdle"
            class="idle_msg"
          >
            <span>You have been idle for too long, please enter your application password for continue</span>
          </div>
          <div
            v-if="showAttemptsLabel"
            class="attemps_msg"
          >
            <span>Attempts left: <b>{{ attempts }}</b></span>
          </div>
          <el-form-item
            prop="password"
          >
            <sora-input
              :variable="$v.form.password"
              name="Password"
              placeholder="••••••••••••"
              label="Password"
              type="password"
              :disabled="isLoading"
              @input="v => form.password = v"
            />
          </el-form-item>
          <sora-button
            label="Continue"
            class="auth-form-last-item_btn"
            type="red"
            :loading="isLoading"
            @click="onSubmit"
          />
          <sora-button
            label="Log out"
            class="auth-form-last-item_btn"
            type="secondary"
            @click="resetSession"
          />
        </el-form>
      </div>
    </div>
  </el-container>
</template>

<script lang="ts">
import { Vue, Component, Mixins } from 'vue-property-decorator'

import { required } from 'vuelidate/lib/validators'
import { lazyComponent } from '@/router'
import { Action, State } from 'vuex-class'
import MessageMixin from '@/components/mixins/message'

@Component({
  components: {
    SoraInput: lazyComponent('UI/SoraInput'),
    SoraButton: lazyComponent('UI/SoraButton')
  }
})
export default class Idle extends Mixins(
  MessageMixin
) {
  form = {
    password: ''
  }
  isLoading = false

  showAttemptsLabel = false
  attempts = 4

  validations () {
    return {
      form: {
        password: {
          required
        }
      }
    }
  }

  @State(state => state.Idle.session.idle) isIdle

  mounted () {
    document.documentElement.style.setProperty('--show-loading', 'none')
  }

  @Action loginWithSession
  @Action resetAccountSession

  async onSubmit () {
    this.isLoading = true
    const { password } = this.form
    try {
      await this.loginWithSession({ password })
      this.$router.push({ name: 'wallets' })
    } catch (error) {
      this.showAttemptsLabel = true
      this.$showErrorAlertMessage('The password you entered is incorrect!', 'Login error')
      this.checkAttemptsNumber()
    }
    this.isLoading = false
  }

  async resetSession () {
    try {
      await this.resetAccountSession()
      this.$router.push({ name: 'login' })
    } catch (error) {}
  }

  checkAttemptsNumber () {
    const attemptsLeft = this.attempts - 1
    if (attemptsLeft === 0) {
      this.resetSession()
    } else {
      this.attempts = attemptsLeft
    }
  }
}
</script>

<style scoped>
.idle_msg {
  padding: 1rem 1.5rem;
  font-size: 0.8rem;
}
.attemps_msg {
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
  font-size: 0.8rem;
}
</style>
