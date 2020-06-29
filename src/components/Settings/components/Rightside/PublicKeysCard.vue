<template>
  <SettingsCard>
    <template slot="header">
      <span
        class="header_btn-title pointed"
        @click="updateActiveTab(1)"
      >
        <span class="header_btn-icon_block">
          <fa-icon
            :icon="activeTab === 1 ? 'angle-down' : 'angle-right'"
            class="header_btn-icon"
          />
        </span>
        Public keys
      </span>
      <el-button
        class="action_button"
        data-cy="addPublicKey"
        @click="addKeyFormVisible = true"
      >
        <fa-icon
          class="action_button-icon"
          icon="plus"
        /> Add
      </el-button>
    </template>
    <template slot="content">
      <div v-if="activeTab === 1">
        <div
          class="settings-item"
          data-cy="accountSignatories"
        >
          <template v-for="(pubKey, index) in accountSignatories">
            <div
              :key="index"
              class="settings-item_row"
            >
              <span
                class="settings-item_row-key text-overflow pointed"
                @click="() => $doCopy(pubKey)"
              >{{ pubKey }}</span>
              <el-button
                v-show="accountSignatories.length !== 1 && pubKey !== accountPublicKey"
                data-cy="removeSignatory"
                class="settings-item_row-delete"
                @click="removeKeyFormVisible = true; keyToRemove = pubKey"
              >
                <fa-icon icon="trash-alt" />
              </el-button>
            </div>
          </template>
        </div>
      </div>
      <el-dialog
        :visible.sync="addKeyFormVisible"
        data-cy="addPublicKeyDialog"
        title="New public key"
        width="470px"
        center
      >
        <el-form>
          <el-form-item>
            <sora-input-with-button
              :variable="$v.form.keyToAdd"
              :disabled="addingNewKey"
              label="Public key"
              accept=".pub"
              @input="v => $v.form.keyToAdd.$model = v"
              @file="onFileChosen"
            />
          </el-form-item>
        </el-form>
        <sora-button
          :loading="addingNewKey"
          label="Add"
          style="padding: 1rem 1.5rem"
          @click="addPublicKey"
        />
        <sora-button
          label="Cancel"
          type="secondary"
          style="padding: 0.5rem 1.5rem"
          @click="closeAddPublicKeyForm()"
        />
      </el-dialog>
      <el-dialog
        :visible.sync="removeKeyFormVisible"
        data-cy="removePublicKeyDialog"
        title="Remove public key"
        width="470px"
        center
      >
        <div
          class="approval_form-desc"
          style="padding: 1rem 1rem"
        >
          <p>Are you sure want to remove</p>
          <p><b class="key_representation">{{ keyToRemove }}</b></p>
          <p>public key?</p>
        </div>
        <sora-button
          :loading="removingKey"
          label="Remove"
          style="padding: 1rem 1.5rem"
          @click="removePublicKey"
        />
        <sora-button
          label="Cancel"
          type="secondary"
          style="padding: 0.5rem 1.5rem"
          @click="removeKeyFormVisible = false"
        />
      </el-dialog>
    </template>
  </SettingsCard>
</template>

<script lang="ts">
import FileSaver from 'file-saver'
import { mapActions, mapGetters } from 'vuex'
import { lazyComponent } from '@/router'
import { required } from 'vuelidate/lib/validators'
import {
  _keyPattern,
  ErrorHandler
} from '@/components/mixins/validation'
import ClipboardMixin from '@/components/mixins/clipboard'

import { Vue, Component, Mixins, Prop } from 'vue-property-decorator'
import { Getter, Action, State } from 'vuex-class'
import TransactionMixin from '@/components/mixins/transaction'

@Component({
  components: {
    SettingsCard: lazyComponent('Settings/components/Rightside/SettingsCard'),
    SoraButton: lazyComponent('UI/SoraButton'),
    SoraInputWithButton: lazyComponent('UI/SoraInputWithButton')
  }
})
export default class PublicKeysCard extends Mixins(
  ErrorHandler,
  ClipboardMixin,
  TransactionMixin
) {
  @Prop(Number) readonly activeTab!: number
  @Prop(Function) readonly updateActiveTab!: Function
  @Prop(Function) readonly openApprovalDialog!: Function

  validations () {
    return {
      form: {
        keyToAdd: {
          required,
          _keyPattern
        }
      }
    }
  }

  addKeyFormVisible = false
  removeKeyFormVisible = false
  downloadKeyVisible = false
  fileData = {
    username: '',
    privateKey: ''
  }
  isDownloaded = false
  addingNewKey = false
  keyToRemove = null
  removingKey = false
  form = {
    keyToAdd: ''
  }

  @State(state => state.Account.accountPublicKey) accountPublicKey

  @Getter accountQuorum
  @Getter accountSignatories

  created () {
    this.getSignatories()
  }

  @Action getSignatories
  @Action createAddSignatoryTransaction
  @Action createRemoveSignatoryTransaction

  async addPublicKey () {
    this.$v.$touch()
    if (this.$v.$invalid) return

    const transaction = await this.createAddSignatoryTransaction(this.form.keyToAdd)

    this.form.keyToAdd = ''
    this.updateActiveTab(1)
    this.addingNewKey = false
    this.addKeyFormVisible = false

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
  async removePublicKey () {
    if (this.accountSignatories.length === 1) {
      this.$message.error('Amount of public keys can\'t be smaller than quorum')
      return
    }

    const transaction = await this.createRemoveSignatoryTransaction(this.keyToRemove)

    this.updateActiveTab(1)
    this.removingKey = false
    this.removeKeyFormVisible = false

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
  onFileChosen (file, fileList) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      this.form.keyToAdd = (reader.result as string || '').trim()
      this.$v.$touch()
    }
    reader.readAsText(file.raw)
  }
  onClickDownload () {
    const filename = `${this.fileData.username}.priv`
    const blob = new Blob(
      [this.fileData.privateKey],
      { type: 'text/plain;charset=utf-8' }
    )

    if (window['Cypress']) {
      this.isDownloaded = true
      this.fileData = {
        username: '',
        privateKey: ''
      }
      return filename
    }

    FileSaver.saveAs(blob, filename)

    this.isDownloaded = true
    this.fileData = {
      username: '',
      privateKey: ''
    }
  }

  closeAddPublicKeyForm () {
    this.addKeyFormVisible = false
  }
}
</script>

<style>
</style>
