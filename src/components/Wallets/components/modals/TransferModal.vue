<template>
  <el-dialog
    :visible="isVisible"
    data-cy="transferModal"
    title="Transfer"
    width="470px"
    center
    @close="closeTransferForm()"
  >
    <el-form
      ref="transferForm"
      :model="transferForm"
      class="transfer_form"
    >
      <el-form-item
        prop="amount"
      >
        <number-input
          :variable="$v.transferForm.amount"
          label="Amount"
          name="amount"
          placeholder="0"
          @input="(v) => $v.transferForm.amount.$model = v"
        />
      </el-form-item>
      <el-form-item
        prop="to"
      >
        <sora-input
          :variable="$v.transferForm.to"
          label="Counterparty"
          placeholder="Account ID"
          @input="v => transferForm.to = v"
        />
      </el-form-item>
      <el-form-item
        prop="description"
      >
        <sora-input
          :variable="$v.transferForm.description"
          label="Additional information"
          placeholder="Details"
          @input="v => transferForm.description = v"
        />
      </el-form-item>
      <el-form-item>
        <div class="form-item-text">
          <span>Fee:</span>
          <span class="form-item-text-amount">
            {{ transferFeeAmount | formatPrecision }} {{ wallet.asset }}
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
      label="Transfer"
      class="modal-action"
      @click="onSubmitTransferForm"
    />
  </el-dialog>
</template>

<script lang="ts">
import {
  _amount,
  _user,
  ErrorHandler
} from '@/components/mixins/validation'
import { required, maxLength } from 'vuelidate/lib/validators'
import { FeeTypes } from '@/data/consts'
import { mapGetters, mapActions } from 'vuex'
import numberFormat from '@/components/mixins/numberFormat'
import MessageMixin from '@/components/mixins/message'
import TransactionMixin from '@/components/mixins/transaction'

import { Vue, Component, Prop, Mixins } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { lazyComponent } from '@/router'
import BigNumber from 'bignumber.js'

interface Wallet {
  assetId: string;
}

@Component({
  components: {
    numberInput: lazyComponent('UI/NumberInput'),
    SoraInput: lazyComponent('UI/SoraInput'),
    SoraButton: lazyComponent('UI/SoraButton')
  }
})
export default class TransferModal extends Mixins(
  numberFormat,
  ErrorHandler,
  MessageMixin,
  TransactionMixin
) {
  // https://github.com/vuejs/vue-class-component/issues/94#issuecomment-298813210
  $refs!: {
    transferForm: HTMLFormElement;
  }

  @Prop({ default: false }) readonly isVisible!: boolean
  @Prop(Object) readonly wallet!: Wallet
  @Prop(Function) readonly updateHistory!: Function

  validations () {
    const feeType = this.transferFee[this.wallet.assetId]
      ? this.transferFee[this.wallet.assetId].feeType
      : 'FIXED'
    const transferWallet = {
      ...this.wallet,
      fee: this.currentTransferFee,
      feeType
    }

    return {
      transferForm: {
        to: {
          required,
          _userDomain: _user.nameDomain,
          _userNotExist: _user.nameExist(
            this.servicesIPs['data-collector-service']
          ),
          _userIsMe: _user.isMe(this.accountId)
        },
        amount: {
          required,
          _amount: _amount(transferWallet)
        },
        description: {
          maxLength: maxLength(64)
        }
      }
    }
  }

  isSending = false
  transferForm = {
    to: '',
    amount: '',
    description: ''
  }

  @Getter accountId
  @Getter accountQuorum
  @Getter transferFee
  @Getter servicesIPs
  @Getter currentWalletPrecision

  get currentTransferFee () {
    const sora = '@sora'
    if (!this.transferForm.to.includes(sora)) return 0

    return this.transferFee[this.wallet.assetId]
      ? this.transferFee[this.wallet.assetId].feeFraction
      : 0
  }
  get transferFeeAmount () {
    if (
      this.transferFee[this.wallet.assetId] &&
      this.transferFee[this.wallet.assetId].feeType === 'FRACTION'
    ) {
      return this.$multiply(
        this.transferForm.amount,
        this.currentTransferFee,
        this.currentWalletPrecision
      ).toString()
    }
    return this.currentTransferFee
  }

  get totalSum () {
    const v = new BigNumber(this.transferForm.amount || 0)
      .plus(
        new BigNumber(this.transferFeeAmount)
      )
    return v.gt(new BigNumber(Number.MAX_SAFE_INTEGER))
      ? '-'
      : v.toString()
  }

  @Action createTransferAssetTransaction

  async onSubmitTransferForm () {
    if (!this.$v.transferForm) return
    this.$v.transferForm.$touch()
    if (this.$v.transferForm.$invalid) return

    const transaction = await this.createTransferAssetTransaction({
      assetId: this.wallet.assetId,
      to: this.transferForm.to,
      description: this.transferForm.description,
      amount: this.transferForm.amount,
      fee: this.transferFeeAmount,
      feeType: FeeTypes.TRANSFER
    })

    this.closeTransferForm()

    this.$sendTransaction(
      transaction,
      () => this.accountQuorum > 1
        ? this.$message.warning('Transaction waiting for other signatures. Please continue signing on "Waiting tab"')
        : this.$message.success('Transaction successuflly send!')
    )
      .catch(err => {
        console.error('Error:', err)
      })
  }

  resetTransferForm () {
    if (this.$refs.transferForm) {
      this.$v.$reset()
      this.$refs.transferForm.resetFields()
    }
  }

  closeTransferForm () {
    this.resetTransferForm()
    this.$emit('update-history')
    this.$emit('update:isVisible', false)
  }
}
</script>

<style>
.form-item-text {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  padding: 0 1.5rem;
}
.form-item-text:last-child {
  border-top: 1px solid #E5E5E5;
  font-size: larger
}
</style>
