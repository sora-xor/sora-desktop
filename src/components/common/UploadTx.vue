<template>
  <div
    v-if="isLoading"
    class="timer-spinner small"
  >
    <img
      class="timer-spinner-icon"
      src="@/assets/spinner.svg"
    >
  </div>
  <el-upload
    v-else
    ref="galery"
    :multiple="false"
    :show-file-list="false"
    :auto-upload="false"
    :on-change="onTransactionChosen"
    drag
    class="transaction-uploader"
    action=""
    list-type="picture"
    accept=".bin"
  >
    <i class="el-icon-plus image-uploader-icon" />
    <div class="message">
      Drop transaction here or <b>click to upload</b>
    </div>
    <div class="message-small">
      Transaction will be automatically send after validation
    </div>
  </el-upload>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Action } from 'vuex-class'

@Component
export default class UploadTx extends Vue {
  @Prop(Function) readonly onComplete!: ({ status }: { status: number }) => void

  isLoading = false

  @Action sendBinaryTransaction

  onTransactionChosen (file, fileList) {
    const reader = new FileReader()

    reader.onload = async (ev) => {
      if (ev.target) {
        const bytes = reader.result as ArrayBuffer || []
        this.isLoading = true
        try {
          await this.sendBinaryTransaction(
            new Uint8Array(bytes)
          )
          this.onComplete({ status: 1 })
        } catch (error) {
          this.$message.error('Error! Please check your transaction!')
          console.error(error)
          this.onComplete({ status: -1 })
        }
        this.isLoading = false
      }
    }

    reader.readAsArrayBuffer(file.raw)
  }
}
</script>

<style>
.transaction-uploader {
  width: 100%;
  padding: 1rem;
  color: #000000;
}
.transaction-uploader .el-upload,
.transaction-uploader .el-upload-dragger {
  width: 100%;
  height: 8rem;
}

.transaction-uploader .el-upload:focus {
  color: #000000;
}

.transaction-uploader .el-upload-dragger > .el-icon-plus.image-uploader-icon {
  padding: 1.5rem;
}

.message {
  font-size: 0.95rem;
}

.message-small {
  margin-top: 0.25rem;
  font-size: 0.75rem;
}

.timer-spinner.small {
  min-height: 10rem;
}
</style>
