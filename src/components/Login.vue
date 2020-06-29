<template>
  <el-container class="flex-center">
    <img
      src="@/assets/Sora.svg"
      alt="SoraNet"
      class="auth-header_logo"
    >
    <div class="auth-container">
      <div class="auth-header">
        <span class="auth-header_title">Log in to SoraNet</span>
      </div>
      <div
        v-if="currentStep === steps.Auth"
        class="auth-form-container"
      >
        <el-form
          ref="form"
          :model="form"
          class="auth-form"
          label-position="top"
          @submit.prevent.native="onSubmit"
        >
          <el-form-item
            prop="passphrase"
          >
            <sora-input
              :variable="$v.form.mnemonic"
              :disabled="isLoading || isFieldDisabled(AuthMethods.passphrase)"
              :rows="3"
              name="passphrase"
              placeholder="Please enter your 15-word mnemonic sentence"
              label="Passphrase"
              type="textarea"
              @input="v => form.mnemonic = v"
            />
          </el-form-item>
          <div class="auth-form_separator">
            <span
              class="clickable"
              @click="() => showAdvancedOptions = !showAdvancedOptions"
            >{{ showAdvancedOptions ? 'Hide' : 'Advanced' }}</span>
          </div>
          <template v-if="showAdvancedOptions">
            <div class="auth-form_radio">
              <el-radio
                v-model="authMethod"
                class="currencies_list-select"
                :label="0"
              >
                Passphrase
              </el-radio>
              <el-radio
                v-model="authMethod"
                class="currencies_list-select"
                :label="1"
              >
                Key pair
              </el-radio>
            </div>
            <el-form-item
              prop="privateKey"
            >
              <sora-input-with-button
                :variable="$v.form.privateKey"
                :disabled="isLoading || isFieldDisabled(AuthMethods.keypair)"
                name="privateKey"
                placeholder="••••••••••••"
                label="Private key"
                type="password"
                accept=".priv"
                @input="v => form.privateKey = v"
                @file="onFileChosen"
              />
            </el-form-item>
            <el-form-item
              prop="username"
            >
              <sora-input
                :variable="$v.form.username"
                :disabled="isLoading || isFieldDisabled(AuthMethods.keypair)"
                name="username"
                placeholder="name@sora"
                label="Username"
                @input="v => form.username = v"
              />
            </el-form-item>
            <el-form-item
              prop="nodeIp"
            >
              <sora-select
                label="Node IP"
                :variable="$v.form.nodeIp"
                :filterable="true"
                :allow-create="true"
                @change="v => form.nodeIp = v"
              >
                <template slot="options">
                  <el-option
                    v-for="option in nodeIPs"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  >
                    <span class="option left">{{ option.label }}</span>
                  </el-option>
                </template>
              </sora-select>
            </el-form-item>
          </template>
          <el-form-item
            class="auth-form-last-item"
          >
            <sora-button
              label="Log In"
              class="auth-form-last-item_btn"
              type="red"
              :loading="isLoading"
              @click="onSubmit"
            />
            <router-link
              to="/signup"
              data-cy="toRegisterPage"
            >
              <sora-button
                label="Register"
                type="secondary"
              />
            </router-link>
          </el-form-item>
        </el-form>
      </div>
      <div
        v-if="currentStep === steps.Password"
        class="auth-form-container"
      >
        <el-form
          ref="form"
          :model="security"
          class="auth-form"
          label-position="top"
          @submit.prevent.native="setupPassword"
        >
          <el-form-item
            prop="password"
          >
            <sora-input
              :variable="$v.security.password"
              :disabled="isLoading"
              name="password"
              placeholder="••••••••••••"
              label="Password"
              type="password"
              @input="v => security.password = v"
            />
          </el-form-item>
          <el-form-item
            prop="repassword"
          >
            <sora-input
              :variable="$v.security.repassword"
              :disabled="isLoading"
              name="repassword"
              placeholder="••••••••••••"
              label="Repeat password"
              type="password"
              @input="v => security.repassword = v"
            />
          </el-form-item>
          <el-form-item
            class="auth-form-last-item"
          >
            <sora-button
              label="Set password"
              class="auth-form-last-item_btn"
              type="red"
              :loading="isLoading"
              @click="setupPassword"
            />
            <sora-button
              label="Back"
              type="secondary"
              @click="currentStep = steps.Auth"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>
  </el-container>
</template>

<script lang="ts">
import MessageMixin from '@/components/mixins/message'
import {
  _keyPattern,
  _nodeIp,
  _user,
  _mnemonic,
  _password
} from '@/components/mixins/validation'
import { required, sameAs } from 'vuelidate/lib/validators'

import { Vue, Component, Mixins } from 'vue-property-decorator'
import { Getter, Action, State } from 'vuex-class'
import { lazyComponent } from '@/router'
import { setNodeIp } from '@/util/iroha/util'
import mnemonicUtil from '@/util/mnemonic-util'
import { derivePublicKey } from 'ed25519.js'
import { AuthMethods } from '@/data/enums'

enum LoginSteps {
  Auth,
  Password
}

@Component({
  components: {
    SoraInput: lazyComponent('UI/SoraInput'),
    SoraInputWithButton: lazyComponent('UI/SoraInputWithButton'),
    SoraSelect: lazyComponent('UI/SoraSelect'),
    SoraButton: lazyComponent('UI/SoraButton')
  }
})
export default class Login extends Mixins(
  MessageMixin
) {
  AuthMethods = AuthMethods
  steps = LoginSteps
  currentStep = LoginSteps.Auth
  isLoading = false
  form = {
    mnemonic: '',
    username: '',
    privateKey: '',
    nodeIp: ''
  }
  security = {
    password: '',
    repassword: ''
  }
  showAdvancedOptions = false
  authMethod = AuthMethods.passphrase

  validations () {
    const securityPart = {
      security: {
        password: {
          required,
          _passwordLength: _password.atLeastLength,
          _passwordLatin: _password.allowedSymbols,
          _passwordAtLeastOneUpper: _password.atLeastOneUpper,
          _passwordAtLeastOneLower: _password.atLeastOneLower,
          _passwordAtLeastOneDigit: _password.atLeastOneDigit
        },
        repassword: {
          required,
          _sameAsPassword: sameAs('password')
        }
      }
    }

    if (this.authMethod === AuthMethods.passphrase) {
      return {
        form: {
          mnemonic: {
            required,
            _mnemonic
          },
          username: {},
          privateKey: {},
          nodeIp: {
            _nodeIp
          }
        },
        ...securityPart
      }
    }
    return {
      form: {
        mnemonic: {},
        username: {
          required,
          _userDomain: _user.nameDomain
        },
        privateKey: {
          required,
          _keyPattern
        },
        nodeIp: {
          required,
          _nodeIp
        }
      },
      ...securityPart
    }
  }

  @Getter nodeIPs

  created () {
    this.form.nodeIp = this.nodeIPs[0].value
    setNodeIp(this.form.nodeIp)
  }

  mounted () {
    document.documentElement.style.setProperty('--show-loading', 'none')
  }

  @Action login
  @Action setAccountSession

  onFileChosen (file) {
    const reader = new FileReader()

    reader.onload = (ev) => {
      if (ev.target) {
        this.form.privateKey = (reader.result as string || '').trim()
        this.form.username = file.name.replace('.priv', '')
        this.$v.$touch()
      }
    }

    reader.readAsText(file.raw)
  }

  async onSubmit () {
    this.$v.form.$touch()
    if (this.$v.form.$invalid) return

    this.isLoading = true

    if (this.authMethod === AuthMethods.passphrase) {
      this.form.privateKey = await mnemonicUtil.getIrohaKey(this.form.mnemonic)
      const publicKey = derivePublicKey(
        Buffer.from(this.form.privateKey, 'hex')
      ).toString('hex')
      this.form.username = `did_sora_${publicKey.substr(0, 20)}@sora`
    }

    try {
      await this.login({
        mnemonic: this.form.mnemonic,
        username: this.form.username,
        privateKey: this.form.privateKey,
        nodeIp: this.form.nodeIp
      })
      this.currentStep = this.steps.Password
      this.$v.$reset()
    } catch (error) {
      console.error(error)
      this.$showErrorAlertMessage(error.message, 'Login error', { authMethod: this.authMethod })
    }
    this.isLoading = false
  }

  isFieldDisabled (method) {
    return this.authMethod !== method
  }

  async setupPassword () {
    this.$v.security.$touch()
    if (this.$v.security.$invalid) return

    const { username, privateKey, nodeIp } = this.form
    const { password } = this.security
    try {
      await this.setAccountSession({
        username,
        privateKey,
        nodeIp,
        password
      })
      this.$router.push({ name: 'wallets' })
    } catch (error) {}
  }
}
</script>

<style scoped>
.auth-form_separator {
  display: flex;
  justify-content: center;
  margin: 1rem;
  font-size: 0.8rem;
}

.auth-form_radio {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

.currencies_list-select.is-checked {
  border-color: #000000;
}
.currencies_list-select.is-checked >>> .el-radio__inner {
  border-color: #000000;
  background-color: #000000;
}
.currencies_list-select.is-checked >>> .el-radio__label {
  color: #000000;
}
</style>
