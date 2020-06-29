import { Vue, Component } from 'vue-property-decorator'

@Component
export default class ClipboardMixin extends Vue {
  $doCopy (key: string) {
    const onSuccess = (e) => this.$message('Copied to clipboard')
    const onError = (e) => this.$message.error('Failed to copy!')
    this.$copyText(key)
      .then(onSuccess)
      .catch(onError)
  }
}
