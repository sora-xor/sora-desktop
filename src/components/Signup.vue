<template>
  <el-container class="flex-center">
    <img
      src="@/assets/Sora.svg"
      alt="SoraNet"
      class="auth-header_logo"
    >
    <div
      v-if="currentStep === 0"
      class="auth-container"
    >
      <div class="auth-header">
        <span class="auth-header_title">Register in SoraNet</span>
      </div>
      <div
        v-if="isActiveFieldType(AvaliableFields.Keypair)"
      >
        <sora-github-badge />
      </div>
      <div class="auth-form-container">
        <el-form
          ref="form"
          :model="form"
          class="auth-form"
          label-position="top"
        >
          <p class="auth-form_separator">
            In the next step, your mnemonic phrase will be generated. Make sure no one is able to see your screen during this phase.
          </p>
          <div class="auth-form_separator">
            <span
              class="clickable"
              @click="() => showAdvancedOptions = !showAdvancedOptions"
            >{{ showAdvancedOptions ? 'Hide' : 'Advanced' }}</span>
          </div>
          <template v-if="showAdvancedOptions">
            <el-form-item
              prop="keypair"
            >
              <sora-select
                label="Key pair"
                :variable="$v.form.type"
                @change="v => form.type = v"
              >
                <template slot="options">
                  <el-option
                    v-for="option in avaliableFieldsSelect"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                    class="options-sss"
                  >
                    <span class="option left">{{ option.label }}</span>
                  </el-option>
                </template>
              </sora-select>
            </el-form-item>
            <el-form-item
              v-if="isActiveFieldType(AvaliableFields.Keypair)"
              prop="privateKey"
            >
              <sora-input-with-button
                :variable="$v.form.privateKey"
                :disabled="isLoading"
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
              v-if="isActiveFieldType(AvaliableFields.Keypair)"
              prop="username"
            >
              <sora-input
                :variable="$v.form.username"
                :disabled="isLoading"
                label="Username"
                placeholder="example"
                @input="v => form.username = v"
              />
            </el-form-item>
            <el-form-item
              v-if="isActiveFieldType(AvaliableFields.Passphrase)"
              prop="privateKey"
            >
              <sora-input
                :variable="$v.form.mnemonic"
                :disabled="isLoading"
                :rows="3"
                name="passphrase"
                placeholder="Please enter your 15-word mnemonic sentence"
                label="Passphrase"
                type="textarea"
                @input="v => form.mnemonic = v"
              />
            </el-form-item>
            <el-form-item
              prop="nodeIp"
            >
              <sora-select
                label="Registration IP"
                :variable="$v.form.nodeIp"
                :filterable="true"
                :allow-create="true"
                @change="selectNotaryIp"
              >
                <template slot="options">
                  <el-option
                    v-for="option in registrationIPs"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                    class="options-sss"
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
              label="Register"
              class="auth-form-last-item_btn"
              type="red"
              :loading="isLoading"
              @click="onSignUp"
            />
            <router-link
              to="/login"
              data-cy="toLoginPage"
            >
              <sora-button
                label="Log In"
                type="secondary"
              />
            </router-link>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div
      v-if="currentStep === 1"
      class="auth-container"
    >
      <div class="auth-header">
        <span class="auth-header_title">Save your private information</span>
        <span class="auth-header_subtitle">This file contains your account username, passphrase and ethereum private key that will be used to confirm the withdrawal of your money.</span>
      </div>
      <div class="auth-form-container">
        <div class="auth-form-save-private">
          <span>Download file and keep it in a safe place</span>
          <sora-button
            label="Download file..."
            type="plain"
            @click="downloadFile"
          />
        </div>
        <sora-button
          label="Yes, I saved it"
          style="padding: 0.5rem"
          :disabled="!isFileDownloaded"
          :type="isFileDownloaded ? 'red' : 'secondary'"
          @click="registrationDone"
        />
      </div>
    </div>
  </el-container>
</template>

<script lang="ts">
import MessageMixin from '@/components/mixins/message'

import { _nodeIp, _user, _keyPattern, _mnemonic } from '@/components/mixins/validation'
import { required } from 'vuelidate/lib/validators'

import { Vue, Component, Mixins } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { lazyComponent } from '@/router'
import FileSaver from 'file-saver'
import transactionUtil from '@/util/transaction-util'
import { derivePublicKey } from 'ed25519.js'
import mnemonicUtil from '../util/mnemonic-util'
import { setCache } from '../util/iroha/util'

enum AvaliableFields {
  Generate,
  Keypair,
  Passphrase
}

@Component({
  components: {
    SoraInput: lazyComponent('UI/SoraInput'),
    SoraInputWithButton: lazyComponent('UI/SoraInputWithButton'),
    SoraSelect: lazyComponent('UI/SoraSelect'),
    SoraButton: lazyComponent('UI/SoraButton'),
    SoraGithubBadge: lazyComponent('UI/SoraGithubBadge'),
    SoraUploadTx: lazyComponent('UI/SoraUploadTx')
  }
})
export default class SignUp extends Mixins(
  MessageMixin
) {
  AvaliableFields = AvaliableFields
  isLoading = false
  form = {
    type: AvaliableFields.Generate,
    mnemonic: '',
    nodeIp: '',
    privateKey: '',
    username: ''
  }
  result = {
    mnemonic: '',
    username: '',
    irohaPrivateKey: '',
    ethPrivateKey: ''
  }
  currentStep = 0
  showAdvancedOptions = false
  avaliableFieldsSelect = [
    { value: AvaliableFields.Generate, label: 'Generate' },
    { value: AvaliableFields.Keypair, label: 'Use my key pair' },
    { value: AvaliableFields.Passphrase, label: 'Use my passphrase' }
  ]
  isFileDownloaded = false

  validations () {
    if (this.showAdvancedOptions) {
      return {
        form: {
          type: {},
          privateKey: this.form.type === AvaliableFields.Keypair
            ? {
              required,
              _keyPattern
            } : {},
          username: this.form.type === AvaliableFields.Keypair
            ? {
              required,
              _userName: _user.name,
              _userExist: async () => {
                const isExist = await _user.nameExist(
                  this.servicesIPs['data-collector-service']
                )(`${this.form.username}@sora`)
                return !isExist
              }
            } : {},
          mnemonic: this.form.type === AvaliableFields.Passphrase
            ? {
              required,
              _mnemonic
            } : {},
          nodeIp: {
            required,
            _nodeIp
          }
        }
      }
    }
    return {}
  }

  @Getter registrationIPs
  @Getter servicesIPs

  created () {
    this.form.nodeIp = this.registrationIPs[0].value || ''
  }

  beforeMount () {
    this.selectNotaryIp()
  }

  mounted () {
    document.documentElement.style.setProperty('--show-loading', 'none')
  }

  @Action setNotaryIp
  @Action signupWithKey
  @Action signUpWithEthereumWallet
  @Action sendBinaryTransaction

  async nextStep (step) {
    this.currentStep = step
  }

  cancelRegistration () {
    if (!this.$v.form) return
    this.isLoading = false
    this.form = {
      ...this.form,
      privateKey: ''
    }
    this.result.ethPrivateKey = ''
    this.$v.form.$reset()
    this.nextStep(0)
  }

  registrationDone () {
    this.$message.success('Success! Registration completed!')
    this.$router.push('/login')
  }

  async sendEthereumTransaction (username: string, irohaPrivateKey: string, ethPrivateKey: string) {
    const { transaction } = await this.signUpWithEthereumWallet({
      accountId: username,
      irohaQuorum: 2,
      privateKeys: [irohaPrivateKey],
      ethPrivateKey
    })
    this.result.ethPrivateKey = ethPrivateKey
    await this.sendBinaryTransaction(
      transaction.serializeBinary()
    )
  }

  async onSignUp () {
    this.$v.$touch()
    if (this.$v.$invalid) return

    this.isLoading = true

    this.selectNotaryIp()

    const {
      username,
      mnemonic,
      publicKey,
      irohaPrivateKey,
      ethPrivateKey
    } = await this.derive()

    try {
      await this.signupWithKey({
        username,
        publicKey
      })
      setCache(mnemonic, username, irohaPrivateKey)
      await this.sendEthereumTransaction(username, irohaPrivateKey, ethPrivateKey)
    } catch (error) {
      this.$showRegistrationError(error.message)
    }

    this.result.username = username
    this.result.mnemonic = mnemonic
    this.result.irohaPrivateKey = irohaPrivateKey
    this.result.ethPrivateKey = ethPrivateKey

    this.isLoading = false

    this.nextStep(1)
  }

  selectNotaryIp () {
    this.setNotaryIp({ ip: this.form.nodeIp })
  }

  onFileChosen (file, fileList) {
    const reader = new FileReader()

    reader.onload = (ev) => {
      if (ev.target) {
        this.form.privateKey = (reader.result as string || '').trim()
        this.$v.$touch()
      }
    }

    reader.readAsText(file.raw)
  }

  downloadFile () {
    let data = `Username: ${this.result.username}\n`
    if (this.result.mnemonic.length) {
      data += `Passphrase: ${this.result.mnemonic}\n`
    }
    data += `VAL key: ${this.result.irohaPrivateKey}\nETH key: ${this.result.ethPrivateKey}\n\n# This file contains private keys from your wallets, VAL key is used for authorization in the system by key pair.\n# Save this file in a safe place!`
    const filename = `${this.result.username}.priv`
    const blob = new Blob(
      [data],
      { type: 'text/plain;charset=utf-8' }
    )
    FileSaver.saveAs(blob, filename)
    this.isFileDownloaded = true
  }

  async derive () {
    if (this.form.type === AvaliableFields.Generate) {
      const mnemonic = mnemonicUtil.generateMnemonic()
      const irohaPrivateKey = await mnemonicUtil.getIrohaKey(mnemonic)
      const ethPrivateKey = await mnemonicUtil.getEthereumKey(mnemonic)
      const publicKey = derivePublicKey(
        Buffer.from(irohaPrivateKey, 'hex')
      ).toString('hex')
      const username = `did_sora_${publicKey.substr(0, 20)}@sora`
      return {
        username,
        mnemonic,
        irohaPrivateKey,
        ethPrivateKey,
        publicKey
      }
    } else if (this.form.type === AvaliableFields.Keypair) {
      // TODO: We need to think about what to do with UX,
      // because authorization via keyword pair involves
      // quite a different behavior from normal authorization via passphrase.
      const mnemonic = mnemonicUtil.generateMnemonic()
      const irohaPrivateKey = this.form.privateKey
      const ethPrivateKey = await mnemonicUtil.getEthereumKey(mnemonic)
      const publicKey = derivePublicKey(
        Buffer.from(irohaPrivateKey, 'hex')
      ).toString('hex')
      const username = this.form.username.length
        ? `${this.form.username}@sora`
        : `did_sora_${publicKey.substr(0, 20)}@sora`
      return {
        username,
        mnemonic: '',
        irohaPrivateKey,
        ethPrivateKey,
        publicKey
      }
    } else {
      const irohaPrivateKey = await mnemonicUtil.getIrohaKey(this.form.mnemonic)
      const ethPrivateKey = await mnemonicUtil.getEthereumKey(this.form.mnemonic)
      const publicKey = derivePublicKey(
        Buffer.from(irohaPrivateKey, 'hex')
      ).toString('hex')
      const username = `did_sora_${publicKey.substr(0, 20)}@sora`
      return {
        username,
        mnemonic: this.form.mnemonic,
        irohaPrivateKey,
        ethPrivateKey,
        publicKey
      }
    }
  }

  isActiveFieldType (type) {
    return this.form.type === type
  }
}
</script>

<style scoped>
.auth-form-save-private {
  display: flex;
  padding: 1rem 0.5rem;
  font-size: 0.8rem;
  align-items: center;
}
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
