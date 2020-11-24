<template>
  <el-dialog
    id="ethereum-dialog"
    :visible="isVisible"
    data-cy="confirmEthModal"
    title="Confirm the transaction"
    width="470px"
    center
    @close="closeEthreumApprovalDialog()"
  >
    <p class="confirm-eth-modal_desc">
      Sign the transaction by your ethereum private key
    </p>
    <el-form>
      <el-form-item>
        <sora-input-with-button
          :variable="$v.form.privateKey"
          :disabled="isSending"
          accept=".priv"
          label="Ethereum private key"
          type="password"
          @input="v => $v.form.privateKey.$model = v"
          @file="onFileChosen"
        />
      </el-form-item>
    </el-form>
    <sora-button
      :loading="isSending"
      label="Sign"
      style="padding: 1rem 1.5rem"
      @click="submitApprovalDialog"
    />
    <sora-button
      label="Later"
      type="secondary"
      style="padding: 0.5rem 1.5rem"
      @click="closeEthreumApprovalDialog()"
    />
  </el-dialog>
</template>

<script lang="ts">
import { required } from 'vuelidate/lib/validators'

import { Vue, Component, Mixins, Watch } from 'vue-property-decorator'
import { Getter, Action, State } from 'vuex-class'
import { lazyComponent } from '@/router'

interface SoraECDSASignature {
  r: string;
  s: string;
  v: string;
}

interface SoraEthWithdrawalProofs {
  accountIdToNotify: string;
  tokenContractAddress: string;
  amount: string;
  relay: string;
  proofs: SoraECDSASignature[];
  irohaTxHash: string;
  to: string;
  id: string;
  txTime: string;
}

@Component({
  components: {
    SoraButton: lazyComponent('UI/SoraButton'),
    SoraInputWithButton: lazyComponent('UI/SoraInputWithButton')
  }
})
export default class ConfirmModal extends Vue {
  isSending = false
  form = {
    privateKey: ''
  }

  validations () {
    return {
      form: {
        privateKey: {
          required
        }
      }
    }
  }

  @Action closeEthreumApprovalDialog
  @Action executeEthereumContract

  @State(state => state.Ethereum.ethereumDialog.isVisible) isVisible
  @State(state => state.Ethereum.ethereumDialog.proof) proof!: SoraEthWithdrawalProofs

  onFileChosen (file, fileList) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target) {
        this.form.privateKey = (reader.result as string || '').trim()
      }
    }
    reader.readAsText(file.raw)
  }

  async submitApprovalDialog () {
    this.$v.$touch()
    if (this.$v.$invalid) return

    this.isSending = true
    try {
      await this.signTransaction()
      this.isSending = false
      this.closeEthreumApprovalDialog()
    } catch (error) {}
  }

  async signTransaction () {
    const { privateKey } = this.form
    try {
      const vv = this.proof.proofs.map(({ v }) => `0x${v}`)
      const rr = this.proof.proofs.map(({ r }) => `0x${r}`)
      const ss = this.proof.proofs.map(({ s }) => `0x${s}`)
      await this.executeEthereumContract({
        privateKey,
        tokenAddress: this.proof.tokenContractAddress,
        amount: this.proof.amount,
        to: this.proof.to,
        txHash: this.proof.irohaTxHash,
        v: vv,
        r: rr,
        s: ss
      })
      this.$message.success('Success')
    } catch (error) {
      if (error.message.includes('Insufficient funds')) {
        this.$message.error('The account you tried to send transaction from does not have enough funds to pay gas!')
      }
      console.error(error)
    }
  }
}
</script>

<style scoped>
.confirm-eth-modal_desc {
  padding: 1rem;
  text-align: center;
}
</style>
