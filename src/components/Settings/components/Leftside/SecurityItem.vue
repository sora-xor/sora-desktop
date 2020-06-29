<template>
  <SettingsItem
    title="Security"
  >
    <div class="security-item">
      <span class="security-title">OTS</span>
      <el-row
        type="flex"
        align="middle"
      >
        <el-switch
          v-model="signingType"
          active-color="#D0021B"
        />
        <el-tooltip
          effect="dark"
        >
          <div slot="content">
            <p>OTS (Offline transaction signer)</p>
            <p><i>Experimental function, can cause problems with the application.</i></p>
            <br>
            <p>It is an offline app that can generate and sign your transactions.</p>
            <p>OTS gives you one extra layer of security: it never connects to the internet.</p>
            <a
              href="https://github.com/d3ledger/transaction-signer/releases/tag/v0.4.4"
              target="_blank"
            >
              <img
                src="@/assets/Github.svg"
                style="margin-top: 0.5rem; width: 8rem;"
              >
            </a>
          </div>
          <img
            src="@/assets/icons/question.svg"
            class="security-description"
          >
        </el-tooltip>
      </el-row>
    </div>
    <div class="security-item">
      <span class="security-title">Session time</span>
      <sora-select
        :variable="$v.currentIdleTime"
        placeholder="Select"
        style="padding: 0"
      >
        <template slot="options">
          <el-option
            v-for="(time, index) in idleTimeOptions"
            :key="index"
            :label="time.label"
            :value="time.value"
          />
        </template>
      </sora-select>
    </div>
    <div class="security-item">
      <span class="security-title">Password for signing</span>
      <el-switch
        :value="passwordStatus"
        active-color="#D0021B"
        @change="onChangePasswordStatus"
      />
    </div>
    <div class="security-item">
      <span
        class="security-title red"
        @click="updatePasswordFormVisible = true"
      >Update password</span>
    </div>
    <el-dialog
      :visible.sync="updatePasswordFormVisible"
      title="Update password"
      width="470px"
      center
    >
      <el-form>
        <el-form-item>
          <sora-input
            :variable="$v.form.oldPassword"
            :disabled="isUpdating"
            name="password"
            placeholder="••••••••••••"
            label="Old password"
            type="password"
            @input="v => form.oldPassword = v"
          />
        </el-form-item>
        <el-form-item>
          <sora-input
            :variable="$v.form.newPassword"
            :disabled="isUpdating"
            name="password"
            placeholder="••••••••••••"
            label="New password"
            type="password"
            @input="v => form.newPassword = v"
          />
        </el-form-item>
        <el-form-item>
          <sora-input
            :variable="$v.form.newPasswordRepeat"
            :disabled="isUpdating"
            name="password"
            placeholder="••••••••••••"
            label="Repeat new password"
            type="password"
            @input="v => form.newPasswordRepeat = v"
          />
        </el-form-item>
        <sora-button
          label="Update"
          type="red"
          class="last-button"
          :loading="isUpdating"
          @click="beforeSubmit"
        />
      </el-form>
    </el-dialog>
  </SettingsItem>
</template>

<script lang="ts">
import { lazyComponent } from '@/router'

import { Vue, Component } from 'vue-property-decorator'
import { Action, Getter } from 'vuex-class'
import { required, sameAs } from 'vuelidate/lib/validators'
import { _password } from '@/components/mixins/validation'

@Component({
  components: {
    SettingsItem: lazyComponent('Settings/components/Leftside/SettingsItem'),
    SoraSelect: lazyComponent('UI/SoraSelect'),
    SoraInput: lazyComponent('UI/SoraInput'),
    SoraButton: lazyComponent('UI/SoraButton')
  }
})
export default class SecurityItem extends Vue {
  idleTimeOptions = [
    {
      value: 5,
      label: '5 Minutes'
    }, {
      value: 15,
      label: '15 Minutes'
    }, {
      value: 30,
      label: '30 Minutes'
    }, {
      value: 60,
      label: '1 Hour'
    }
  ]
  updatePasswordFormVisible = false
  form = {
    oldPassword: '',
    newPassword: '',
    newPasswordRepeat: ''
  }
  isUpdating = false

  validations () {
    return {
      currentIdleTime: '',
      form: {
        oldPassword: {
          required
        },
        newPassword: {
          required,
          _passwordLength: _password.atLeastLength,
          _passwordLatin: _password.allowedSymbols,
          _passwordAtLeastOneUpper: _password.atLeastOneUpper,
          _passwordAtLeastOneLower: _password.atLeastOneLower,
          _passwordAtLeastOneDigit: _password.atLeastOneDigit
        },
        newPasswordRepeat: {
          required,
          _sameAsPassword: sameAs('newPassword')
        }
      }
    }
  }

  @Getter isOtsEnabled
  @Getter isPasswordEnabled
  @Getter settingsTimeIdle

  get signingType () {
    return this.isOtsEnabled
  }
  set signingType (value) {
    this.updateSecurityOtsStatus(value)
  }

  get passwordStatus () {
    return this.isPasswordEnabled
  }
  set passwordStatus (value) {
    this.updateSecurityPasswordStatus(value)
  }

  get currentIdleTime () {
    return this.settingsTimeIdle
  }
  set currentIdleTime (value) {
    this.updateSecurityIdleTime(value)
  }

  @Action updateSecurityOtsStatus
  @Action updateSecurityPasswordStatus
  @Action updateSecurityIdleTime
  @Action checkPassword
  @Action updatePassword
  @Action openPasswordDialog

  async onChangePasswordStatus (status) {
    try {
      await this.openPasswordDialog()
      this.passwordStatus = status
    } catch (error) {
    }
  }

  async beforeSubmit () {
    this.$v.$touch()
    if (this.$v.$invalid) return

    this.isUpdating = true
    try {
      await this.checkPassword({ password: this.form.oldPassword })
      await this.updatePassword({
        oldPassword: this.form.oldPassword,
        newPassword: this.form.newPassword
      })
      this.$message.success('Password updated!')
      this.updatePasswordFormVisible = false
    } catch (error) {
      this.$message.error('Wrong old password entered!')
    }
    this.isUpdating = false
  }
}
</script>

<style scoped>
.security-item {
  display: grid;
  grid-template-columns: 0.35fr 0.3fr;
  grid-template-rows: 1fr;
  grid-template-areas: ". .";
  align-items: center;
  margin-bottom: 0.5rem;
}
.security-title {
  font-size: 0.8rem;
  margin-right: 1rem;
}
.security-title.red {
  color: #D0021B;
  cursor: pointer;
}
.security-title.red:hover {
  text-decoration: underline;
}
.security-description {
  width: 1rem;
  cursor: pointer;
  margin-left: 0.5rem;
}
</style>
