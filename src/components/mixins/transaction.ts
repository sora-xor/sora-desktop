import { Vue, Component } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { signWithArrayOfKeys } from 'iroha-helpers'
import { cache } from '@/util/iroha/util'
import { derivePublicKey } from 'ed25519.js'

const isSignedBy = (tx, privateKey: string) => {
  const publicKey = derivePublicKey(
    Buffer.from(privateKey, 'hex')
  ).toString('hex')
  const parsed = tx.toObject()
  return parsed.signaturesList.some(({ publicKey: pk }) => pk === publicKey)
}

@Component
export default class TransactionMixin extends Vue {
  @Getter isOtsEnabled
  @Getter isPasswordEnabled

  @Action sendBinaryTransaction
  @Action openUploadTransactionDialog
  @Action openPasswordDialog

  async $sendTransaction (transaction: any, onSuccess: () => void): Promise<any> {
    const privateKey = cache.key || ''
    if (isSignedBy(transaction, privateKey)) return
    try {
      if (this.isPasswordEnabled) await this.openPasswordDialog()
      if (this.isOtsEnabled) {
        await this.openUploadTransactionDialog({
          transaction,
          onSuccess
        })
      } else {
        await this.sendBinaryTransaction(
          signWithArrayOfKeys(transaction, [privateKey])
            .serializeBinary()
        )
        await onSuccess()
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
