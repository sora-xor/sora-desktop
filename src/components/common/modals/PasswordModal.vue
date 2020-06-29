<template>
  <el-dialog
    :visible="isVisible"
    title="Please enter your password to continue"
    width="470px"
    center
    @close="closeDialog(true)"
  >
    <el-form>
      <el-form-item>
        <sora-input
          :variable="$v.password"
          :disabled="isLoading"
          name="password"
          placeholder="••••••••••••"
          label="Password"
          type="password"
          @input="v => password = v"
        />
      </el-form-item>
    </el-form>
    <sora-button
      label="Confirm"
      type="red"
      class="last-button"
      :loading="isLoading"
      @click="beforeSubmit"
    />
    <sora-button
      label="Cancel"
      type="secondary"
      class="last-button"
      @click="closeDialog(true)"
    />
  </el-dialog>
</template>

<script lang="ts">
import { lazyComponent } from '@/router'
import { required } from 'vuelidate/lib/validators'
import { Vue, Component } from 'vue-property-decorator'
import { Getter, Action, State } from 'vuex-class'

import transactionUtil from '@/util/transaction-util'

@Component({
  components: {
    SoraInput: lazyComponent('UI/SoraInput'),
    SoraButton: lazyComponent('UI/SoraButton')
  }
})
export default class PasswordModal extends Vue {
  password = ''
  isLoading = false

  validations () {
    return {
      password: {
        required
      }
    }
  }

  @State(state => state.Idle.passwordDialog.isVisible) isVisible

  @Action checkPassword
  @Action closePasswordDialog

  async beforeSubmit () {
    this.$v.$touch()
    if (this.$v.$invalid) return

    const password = this.password
    this.isLoading = true
    try {
      await this.checkPassword({ password })
      await this.closeDialog(false)
    } catch (error) {
      this.$message.error('Wrong password entered!')
    }
    this.isLoading = false
  }

  async closeDialog (isClosed) {
    this.$v.$reset()
    this.password = ''
    await this.closePasswordDialog({ isClosed })
  }
}
</script>

<style scoped>
</style>
