<template>
  <div class="sora-upload-tx">
    <div class="sora-upload-tx_list">
      <div class="sora-upload-tx_list-step-btn">
        <div class="sora-upload-tx_list-step">
          <b>1.</b>
          <span class="sora-upload-tx_list-step-desc">Download unsigned transaction file (.draft)</span>
        </div>
        <sora-button
          label="Download file..."
          type="plain"
          @click="download"
        />
      </div>
      <div class="sora-upload-tx_list-step">
        <b>2.</b>
        <span class="sora-upload-tx_list-step-desc">Open OTS app and sign the transaction (.draft) by your soranet private key (.priv)</span>
      </div>
      <div class="sora-upload-tx_list-step">
        <b>3.</b>
        <span class="sora-upload-tx_list-step-desc">Import signed transaction file (.bin)</span>
      </div>
    </div>
    <uploadTx
      :on-complete="complete"
    />
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { lazyComponent } from '@/router'

type emptyFunc = () => void

@Component({
  components: {
    SoraButton: lazyComponent('UI/SoraButton'),
    uploadTx: lazyComponent('common/UploadTx')
  }
})
export default class SoraUploadTx extends Vue {
  @Prop({ default: () => {} }) readonly download!: emptyFunc
  @Prop({ default: () => {} }) readonly complete!: emptyFunc
}
</script>

<style scoped>
.sora-upload-tx {
  padding: 0.5rem 0;
  font-size: 0.8rem;
}
.sora-upload-tx .sora-upload-tx_list-step {
  display: flex;
  padding: 0.5rem 1rem;
}
.sora-upload-tx .sora-upload-tx_list-step .sora-upload-tx_list-step-desc {
  margin-left: 0.5rem;
  word-break: break-word;
}
.sora-upload-tx .sora-upload-tx_list-step-btn {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
}
</style>
