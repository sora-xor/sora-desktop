import { Vue, Component } from 'vue-property-decorator'

import NOTIFICATIONS from '@/data/notifications'
import { AuthMethods } from '@/data/enums'

interface MessageOptions {
  authMethod: AuthMethods;
}

const getErrorMessage = (error, options?: MessageOptions) => {
  const MSG = NOTIFICATIONS.IROHA
  const irohaErrors = Object.keys(MSG)
  const isIncludesList = irohaErrors.map(e => error.includes(e))
  const index = isIncludesList.findIndex(bool => bool)

  if (index === -1) {
    return error
  }

  if (options?.authMethod === AuthMethods.keypair) return MSG.ACCOUNT_RESPONSE.KEYPAIR
  if (options?.authMethod === AuthMethods.passphrase) return MSG.ACCOUNT_RESPONSE.PASSPHRASE

  return MSG[irohaErrors[index]]
}

@Component
export default class MessageMixin extends Vue {
  $showMessageFromStatus (isCompleted, messageCompleted, messageIncompleted) {
    const message = isCompleted
      ? messageCompleted
      : messageIncompleted

    const type = isCompleted
      ? 'success'
      : 'warning'

    this.$message({
      message,
      type
    })
  }
  $showErrorAlertMessage (message, windowName, options?: MessageOptions) {
    const errorMsg = getErrorMessage(message, options)
    this.$alert(errorMsg, windowName, {
      type: 'error'
    })
  }
  $showRegistrationError (message) {
    this.$showErrorAlertMessage(message, 'Sign up error')
  }
}
