<template>
  <el-dialog
    :visible="isVisible"
    data-cy="withdrawalModal"
    title="Withdraw"
    width="470px"
    center
    @close="closeWithdrawDialog()"
  >
    <sora-steps
      :value="currentStep / 5 * 100"
    />
    <template v-if="currentStep === 1">
      <el-form
        ref="withdrawForm"
        :model="withdrawForm"
        class="withdraw_form"
      >
        <el-form-item
          prop="amount"
        >
          <number-input
            :variable="$v.withdrawForm.amount"
            label="Amount"
            name="amount"
            placeholder="0"
            @input="(v) => $v.withdrawForm.amount.$model = v"
          >
            <div slot="append">
              {{ wallet.asset }}
            </div>
          </number-input>
        </el-form-item>
        <el-form-item
          prop="wallet"
        >
          <sora-input
            :variable="$v.withdrawForm.wallet"
            label="Address"
            name="Withdrawal address"
            placeholder="0x0000000000000000000000000000000000000000"
            @input="v => $v.withdrawForm.wallet.$model = v"
          />
        </el-form-item>
        <el-form-item>
          <div class="form-item-text">
            <span>Fee:</span>
            <span class="form-item-text-amount">
              {{ withdrawalFeeAmount | formatPrecision }} {{ wallet.asset }}
            </span>
          </div>
          <div class="form-item-text">
            <span>Total:</span>
            <span class="form-item-text-amount">
              {{ totalSum | formatPrecision }} {{ wallet.asset }}
            </span>
          </div>
        </el-form-item>
      </el-form>
      <sora-button
        :loading="isSending"
        label="Withdraw"
        class="modal-action"
        @click="beforeStep2"
      />
      <sora-button
        :loading="isSending"
        label="Cancel"
        class="modal-action"
        type="secondary"
        @click="closeWithdrawDialog"
      />
    </template>
    <template v-if="currentStep === 2">
      <sora-upload-tx
        :download="downloadTx"
        :complete="onSuccessTransaction"
      />
      <sora-button
        :loading="isSending"
        label="Cancel"
        class="modal-action"
        type="secondary"
        @click="closeWithdrawDialog"
      />
    </template>
    <template v-if="currentStep === 3">
      <div class="timer-spinner">
        <img
          class="timer-spinner-icon"
          src="@/assets/spinner.svg"
        >
        <span class="timer-spinner-countdown">{{ timerAmount }} sec...</span>
      </div>
    </template>
    <template v-if="currentStep === 4">
      <div class="withdraw-error">
        <span class="withdraw-error-desc">You need to sign the transaction by your ethereum private key. You can try again to do it now or later in Waitings tab — Withdrawal.</span>
        <div class="withdraw-error-logo">
          <img src="@/assets/clock.svg">
          <span class="withdraw-error-logo-desc">Something went wrong</span>
        </div>
        <sora-button
          label="Try again..."
          type="blue"
          style="padding: 1rem 1.5rem"
          @click="repeatStep"
        />
        <sora-button
          label="Later"
          type="secondary"
          @click="closeWithdrawDialog"
        />
      </div>
    </template>
    <template v-if="currentStep === 5">
      <div class="withdraw-error">
        <span class="withdraw-error-desc">Sign the transaction by your ethereum private key. You can do it later in Waitings tab — Withdrawal.</span>
        <sora-input-with-button
          :variable="$v.privateKey"
          :disabled="isSending"
          label="Ethereum private key"
          type="password"
          style="margin: 2rem 0;"
          @input="v => $v.privateKey.$model = v"
          @file="onETHPrivateKey"
        />
        <sora-button
          :loading="isSending"
          label="Sign"
          style="padding: 1rem 1.5rem"
          @click="signETHTx"
        />
        <sora-button
          label="Later"
          type="secondary"
          @click="closeWithdrawDialog"
        />
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import {
  _wallet,
  _amount,
  ErrorHandler
} from '@/components/mixins/validation'
import { required } from 'vuelidate/lib/validators'
import {
  FeeTypes,
  NOTARY_ACCOUNT
} from '@/data/consts'
import numberFormat from '@/components/mixins/numberFormat'
import MessageMixin from '@/components/mixins/message'

import { Component, Mixins, Prop } from 'vue-property-decorator'
import { Getter, Action, State } from 'vuex-class'
import find from 'lodash/fp/find'
import { lazyComponent } from '@/router'
import BigNumber from 'bignumber.js'
import configUtil from '@/util/config-util'
import transactionUtil from '@/util/transaction-util'
import TransactionMixin from '@/components/mixins/transaction'

interface Wallet {
  assetId: string;
}

@Component({
  components: {
    numberInput: lazyComponent('UI/NumberInput'),
    SoraInput: lazyComponent('UI/SoraInput'),
    SoraButton: lazyComponent('UI/SoraButton'),
    SoraSteps: lazyComponent('UI/SoraSteps'),
    SoraUploadTx: lazyComponent('UI/SoraUploadTx'),
    SoraInputWithButton: lazyComponent('UI/SoraInputWithButton')
  }
})
export default class WithdrawalModal extends Mixins(
  numberFormat,
  ErrorHandler,
  MessageMixin,
  TransactionMixin
) {
  // https://github.com/vuejs/vue-class-component/issues/94#issuecomment-298813210
  $refs!: {
    withdrawForm: HTMLFormElement;
  }

  @Prop({ default: false }) readonly isVisible!: boolean
  @Prop(Object) readonly wallet!: Wallet
  @Prop(Function) readonly updateHistory!: Function

  isSending = false
  currentStep = 1
  withdrawForm = {
    amount: '',
    wallet: ''
  }
  privateKey = ''

  timerId = 0
  timerAmount = 10

  eventSource
  ethProof

  validations () {
    const feeType = this.withdrawalFee[this.wallet.assetId]
      ? this.withdrawalFee[this.wallet.assetId].feeType
      : 'FIXED'
    const withdrawalWallet = {
      ...this.wallet,
      fee: this.currentWithdrawalFee,
      feeType
    }

    return {
      withdrawForm: {
        amount: {
          required,
          _amount: _amount(withdrawalWallet)
        },
        wallet: {
          required,
          _address: _wallet.address
        }
      },
      privateKey: {
        required
      }
    }
  }

  @Getter withdrawalFee
  @Getter currentWalletPrecision
  @Getter isOtsEnabled

  @Getter accountQuorum
  @Getter accountId
  @Getter servicesIPs

  get currentWithdrawalFee () {
    return this.withdrawalFee[this.wallet.assetId]
      ? this.withdrawalFee[this.wallet.assetId].feeFraction
      : 0
  }
  get withdrawalFeeAmount () {
    if (
      this.withdrawalFee[this.wallet.assetId] &&
      this.withdrawalFee[this.wallet.assetId].feeType === 'FRACTION'
    ) {
      return this.$multiply(
        this.withdrawForm.amount,
        this.currentWithdrawalFee,
        this.currentWalletPrecision
      ).toString()
    }
    return this.currentWithdrawalFee
  }

  get totalSum () {
    const v = new BigNumber(this.withdrawForm.amount || 0)
      .plus(
        new BigNumber(this.withdrawalFeeAmount)
      )
    return v.gt(new BigNumber(Number.MAX_SAFE_INTEGER))
      ? '-'
      : v.toString()
  }

  @Action transferAsset
  @Action createTransferAssetTransaction

  @Action executeEthereumContract

  nextStep (step) {
    if (this.currentStep === 1) {
      if (!this.$v.withdrawForm) return
      this.$v.withdrawForm.$touch()
      if (this.$v.withdrawForm.$invalid) return
    }
    this.currentStep = step
  }

  async downloadTx () {
    const tx = await this.generateTransferAssetTransaction()
    transactionUtil.saveTransaction(tx)
  }

  resetWithdrawForm () {
    if (this.$v.withdrawForm) {
      this.nextStep(1)
      this.withdrawForm = {
        amount: '',
        wallet: ''
      }
      this.$v.withdrawForm.$reset()
    }

    clearInterval(this.timerId)

    if (this.$v.privateKey) {
      this.privateKey = ''
      this.$v.privateKey.$reset()
    }
  }

  onSuccessTransaction () {
    this.nextStep(3)
    this.waitForEthProof()
  }

  waitForEthProof () {
    this.connectToSSE()
    this.timerAmount = 10
    this.timerId = window.setInterval(() => {
      if (this.ethProof) {
        clearInterval(this.timerId)
        this.nextStep(5)
        this.disconnectSSE()
        return
      }
      if (this.timerAmount <= 0) {
        clearInterval(this.timerId)
        this.nextStep(4)
        return
      }
      this.timerAmount -= 1
    }, 1000)
  }

  onETHPrivateKey (file, fileList) {
    const reader = new FileReader()

    reader.onload = (ev) => {
      if (ev.target) {
        this.privateKey = (reader.result as string || '').trim()
        if (this.$v.privateKey) {
          this.$v.privateKey.$touch()
        }
      }
    }

    reader.readAsText(file.raw)
  }

  repeatStep () {
    this.onSuccessTransaction()
  }

  closeWithdrawDialog () {
    this.resetWithdrawForm()
    this.$emit('update-history')
    this.$emit('update:isVisible', false)
  }

  connectToSSE () {
    const sseService = this.servicesIPs['sse-service'].value
    this.eventSource = new EventSource(
      `${configUtil.getUrlProtocol}//${sseService}/notification/subscribe/withdrawalProofs/${this.accountId}`
    )
    this.eventSource.addEventListener('sora-withdrawal-proofs-event', this.handleSSEMessage)
  }

  disconnectSSE () {
    this.eventSource.removeEventListener('sora-withdrawal-proofs-event', this.handleSSEMessage)
    this.eventSource.close()
  }

  handleSSEMessage (event) {
    const proof = JSON.parse(event.data)
    this.ethProof = proof
  }

  async signETHTx () {
    if (!this.$v.privateKey) return
    this.$v.privateKey.$touch()
    if (this.$v.privateKey.$invalid) return
    const proof = this.ethProof
    this.isSending = true
    try {
      const vv = proof.proofs.map(({ v }) => `0x${v}`)
      const rr = proof.proofs.map(({ r }) => `0x${r}`)
      const ss = proof.proofs.map(({ s }) => `0x${s}`)
      await this.executeEthereumContract({
        privateKey: this.privateKey,
        tokenAddress: proof.tokenContractAddress,
        amount: proof.amount,
        to: proof.to,
        txHash: proof.irohaTxHash,
        v: vv,
        r: rr,
        s: ss
      })
      this.closeWithdrawDialog()
      this.$message.success('Success! Transaction sent!')
    } catch (error) {
      console.error(error)
    }
    this.isSending = false
  }

  async generateTransferAssetTransaction () {
    const notaryAccount = NOTARY_ACCOUNT

    return this.createTransferAssetTransaction({
      assetId: this.wallet.assetId,
      to: notaryAccount,
      description: this.withdrawForm.wallet,
      amount: this.withdrawForm.amount,
      fee: this.withdrawalFeeAmount,
      feeType: FeeTypes.WITHDRAWAL
    })
  }

  async beforeStep2 () {
    if (this.isOtsEnabled) {
      this.nextStep(2)
    } else {
      this.isSending = true
      const tx = await this.generateTransferAssetTransaction()
      const nextAction = () => {
        if (this.accountQuorum > 1) {
          this.isSending = false
          this.$message.warning('Withdrawal waiting for other signatures. Please continue signing on "Waiting tab"')
          this.closeWithdrawDialog()
        } else {
          this.isSending = false
          this.onSuccessTransaction()
        }
      }
      await this.$sendTransaction(
        tx,
        nextAction
      )
    }
  }
}
</script>

<style scoped>
.withdraw-error {
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
}
.withdraw-error-desc {
  font-size: 0.9rem;
  padding: 0.5rem 3rem;
  text-align: center;
  word-break: keep-all;
}
.withdraw-error-logo {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
}
.withdraw-error-logo-desc {
  color: rgba(0, 0, 0, 0.5);
  padding-top: 0.5rem;
}
</style>
