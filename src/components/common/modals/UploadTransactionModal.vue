<template>
  <el-dialog
    :visible="uploadTransactionDialogVisible"
    data-cy="uploadTransactionModal"
    title="Please sign the transaction offline"
    width="470px"
    center
    @close="closeDialog"
  >
    <sora-upload-tx
      :download="saveTransaction"
      :complete="completeUploadTx"
    />
    <div
      slot="footer"
      class="dialog-footer"
    >
      <sora-button
        label="Cancel"
        type="secondary"
        @click="closeDialog"
      />
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { lazyComponent } from '@/router'

import { Vue, Component } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'

import transactionUtil from '@/util/transaction-util'

@Component({
  components: {
    UploadTx: lazyComponent('common/UploadTx'),
    SoraButton: lazyComponent('UI/SoraButton'),
    SoraUploadTx: lazyComponent('UI/SoraUploadTx')
  }
})
export default class UploadTransactionModal extends Vue {
  @Getter uploadTransactionDialogVisible
  @Getter uploadTransactionDialogTransaction
  @Getter uploadTransactionDialogSuccessFunction!: ({ status }: { status: number}) => void;

  @Action closeUploadTransactionDialog

  async saveTransaction () {
    const transaction = this.uploadTransactionDialogTransaction

    await transactionUtil.saveTransaction(transaction)
  }

  async completeUploadTx ({ status }) {
    try {
      await this.uploadTransactionDialogSuccessFunction({ status })
      this.closeDialog()
    } catch (error) {
      console.error(error)
    }
  }

  async closeDialog () {
    this.closeUploadTransactionDialog()
  }
}
</script>

<style scoped>
</style>
