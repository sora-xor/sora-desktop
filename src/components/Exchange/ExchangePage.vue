<template>
  <div class="exchange_block">
    <div class="exchange_block-row">
      <div>
        <div class="exchange_form-item">
          <span class="exchange_label">Exchange</span>
          <sora-select
            :variable="$v.form.assetFrom"
            :disabled="isLoading"
            placeholder="Select"
            class="clear_padding"
            @change="selectAssetFrom"
          >
            <template slot="options">
              <el-option
                v-for="(w, index) in wallets"
                :key="index"
                :label="`${w.name} (${w.asset})`"
                :value="w.assetId"
              >
                <span class="option left">{{ w.name }} ({{ w.asset }})</span>
              </el-option>
            </template>
          </sora-select>
          <span class="exchange_label-small">{{ avaliableWalletAmount }}</span>
        </div>
        <div>
          <number-input
            :variable="$v.form.amountFrom"
            :disabled="isLoading || !form.assetFrom.length"
            placeholder="0"
            class="clear_padding"
            @input="updateFromToAmount"
          />
        </div>
      </div>
      <el-row
        type="flex"
        justify="center"
      >
        <div class="exchange_vertical" />
        <img
          class="exchange_vertical-icon"
          src="@/assets/icons/exchange.svg"
          @click="swapWallets"
        >
      </el-row>
      <div>
        <div class="exchange_form-item">
          <span class="exchange_label">Receive</span>
          <sora-select
            :variable="$v.form.assetTo"
            :disabled="isLoading"
            placeholder="Select"
            class="clear_padding"
            @change="selectAssetTo"
          >
            <template slot="options">
              <el-option
                v-for="(w, index) in xstList"
                :key="index"
                :label="`${w.name} (${w.asset})`"
                :value="w.assetId"
              >
                <span class="option left">{{ w.name }} ({{ w.asset }})</span>
              </el-option>
            </template>
          </sora-select>
          <span class="exchange_label-small">{{ walletRate }}</span>
        </div>
        <div>
          <number-input
            :variable="$v.form.amountTo"
            :disabled="isLoading || !form.assetFrom.length"
            placeholder="0"
            class="clear_padding"
            @input="updateToFromAmount"
          />
        </div>
      </div>
    </div>
    <div class="exchange_block-row second">
      <div class="exchange_item">
        <el-row
          type="flex"
          justify="space-between"
        >
          <span class="exchange_item-label">You are exchanging</span>
          <span class="exchange_item-asset">{{ walletByAsset(form.assetFrom).asset }}</span>
        </el-row>
        <div class="exchange_item-price_block">
          <asset-icon
            :asset="walletByAsset(form.assetFrom).asset"
            :size="40"
          />
          <el-tooltip
            :content="totalSend"
            class="item"
            effect="dark"
            placement="top-start"
          >
            <span class="price text-overflow">{{ totalSend }}</span>
          </el-tooltip>
        </div>
        <span class="exchange_item-fee">Fee: {{ exchangeFeeAmount }} XOR</span>
      </div>
      <div class="exchange_item small">
        <el-row
          type="flex"
          justify="center"
          align="middle"
          class="fullheight"
        >
          <img
            src="@/assets/icons/arrow.svg"
          >
        </el-row>
      </div>
      <div class="exchange_item">
        <el-row
          type="flex"
          justify="space-between"
        >
          <span class="exchange_item-label">You will receive</span>
          <span class="exchange_item-asset">{{ xstWallet ? xstWallet.asset : '' }}</span>
        </el-row>
        <div class="exchange_item-price_block">
          <asset-icon
            :asset="xstWallet ? xstWallet.asset : ''"
            :size="40"
          />
          <el-tooltip
            :content="totalReceive"
            class="item"
            effect="dark"
            placement="top-start"
          >
            <span class="price text-overflow">{{ totalReceive }}</span>
          </el-tooltip>
        </div>
      </div>
    </div>
    <el-row
      type="flex"
      justify="center"
    >
      <sora-button
        label="Exchange"
        style="width: 20rem"
        :loading="isLoading"
        @click="onSubmit"
      />
    </el-row>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Mixins } from 'vue-property-decorator'
import { lazyComponent } from '@/router'
import { Getter, Action } from 'vuex-class'

import BN from 'bignumber.js'
import isEmpty from 'lodash/fp/isEmpty'
import uniqBy from 'lodash/fp/uniqBy'
import isObject from 'lodash/fp/isObject'
import { required } from 'vuelidate/lib/validators'
import { _amount, _fee } from '@/components/mixins/validation'
import numberFormat from '@/components/mixins/numberFormat'
import TransactionMixin from '@/components/mixins/transaction'
import { FeeTypes, EXCHANGE_ACCOUNT, BillingTypes } from '@/data/consts'

const BN_FORMAT = {
  prefix: '',
  decimalSeparator: '.',
  groupSeparator: ' ',
  groupSize: 3,
  secondaryGroupSize: 0,
  fractionGroupSeparator: ' ',
  fractionGroupSize: 0,
  suffix: ''
}

@Component({
  components: {
    SoraSelect: lazyComponent('UI/SoraSelect'),
    SoraInput: lazyComponent('UI/SoraInput'),
    SoraButton: lazyComponent('UI/SoraButton'),
    NumberInput: lazyComponent('UI/NumberInput'),
    AssetIcon: lazyComponent('common/AssetIcon')
  }
})
export default class ExchangePage extends Mixins(
  numberFormat,
  TransactionMixin
) {
  form = {
    assetFrom: '',
    assetTo: '',
    amountFrom: '',
    amountTo: ''
  }

  rates = {}

  isLoading = false

  XOR = 'xor#sora'

  validations () {
    const feeType = this.exchangeFee[this.XOR]
      ? this.exchangeFee[this.XOR].feeType
      : 'FIXED'
    const mainWallet = {
      ...this.walletByAsset(this.form.assetFrom)
    }
    const feeWallet = {
      ...this.walletByAsset(this.XOR),
      fee: this.currentExchangeFee
    }
    return {
      form: {
        assetFrom: {
          required
        },
        assetTo: {
          required
        },
        amountFrom: {
          required,
          _amount: _amount(mainWallet),
          _fee: _fee(feeWallet)
        },
        amountTo: {
          required
        }
      }
    }
  }

  async created () {
    const isSoraExist = this.wallets.some(({ assetId }) => assetId === this.XOR)
    if (isSoraExist) {
      this.form.assetFrom = this.XOR
    }

    this.form.assetTo = this.xstList[0].assetId
    await this.updateAssetRates()
    await this.updateBillingData()
  }

  @Getter wallets
  @Getter accountId
  @Getter accountQuorum
  @Getter exchangeFee

  get xstList () {
    const list = uniqBy('assetId')([
      { assetId: 'usd#xst', name: 'StableCoin', asset: 'USD', precision: 2 },
      { assetId: 'jpy#xst', name: 'StableCoin', asset: 'JPY', precision: 0 },
      { assetId: 'chf#xst', name: 'StableCoin', asset: 'CHF', precision: 2 },
      { assetId: 'rub#xst', name: 'StableCoin', asset: 'RUB', precision: 2 },
      { assetId: 'qar#xst', name: 'StableCoin', asset: 'QAR', precision: 2 },
      { assetId: 'dkk#xst', name: 'StableCoin', asset: 'DKK', precision: 2 },
      { assetId: 'nok#xst', name: 'StableCoin', asset: 'NOK', precision: 2 },
      { assetId: 'xdr#xst', name: 'StableCoin', asset: 'XDR', precision: 2 },
      { assetId: 'xau#xst', name: 'StableCoin', asset: 'XAU', precision: 3 },
      ...this.wallets
    ]) as any
    return list.filter(({ assetId }) => assetId !== this.form.assetFrom)
  }

  get avaliableWalletAmount () {
    const wallet = this.walletByAsset(this.form.assetFrom)
    if (isEmpty(wallet)) return

    const amountShort = numberFormat.filter('formatPrecision')(wallet.amount)
    return `${amountShort} ${wallet.asset}`
  }

  get xstWallet () {
    return this.xstList.find(({ assetId }) => (assetId === this.form.assetTo))
  }

  get xstWalletRates () {
    if (!this.xstWallet) return new BN(0)
    const rate = this.rates[this.xstWallet.assetId]
    if (rate) return rate.decimalPlaces(5)
    return rate
  }

  get walletRate () {
    const wallet = this.walletByAsset(this.form.assetFrom)
    if (isEmpty(wallet)) return

    if (!this.xstWallet) return

    const rate = this.xstWalletRates
      ? this.xstWalletRates.toFormat(BN_FORMAT)
      : '...'

    return `1 ${wallet.asset} = ${rate} ${this.xstWallet.asset}`
  }

  get currentExchangeFee () {
    return this.exchangeFee[this.XOR]
      ? this.exchangeFee[this.XOR].feeFraction
      : 0
  }
  get exchangeFeeAmount () {
    if (
      this.exchangeFee[this.XOR] &&
      this.exchangeFee[this.XOR].feeType === 'FRACTION'
    ) {
      return this.$multiply(
        this.form.amountFrom,
        this.currentExchangeFee,
        this.walletByAsset(this.XOR).precision
      ).toString()
    }
    return this.currentExchangeFee
  }

  get totalSend () {
    const amount = this.form.amountFrom || '0'
    if (new BN(amount).eq(0)) return '0'
    const wallet = this.wallets
      .find(({ assetId }) => this.form.assetFrom === assetId)
    const precision = isObject(wallet) as any ? wallet.precision : 18
    return new BN(amount).decimalPlaces(precision).toFormat(
      BN_FORMAT
    )
  }

  get totalReceive () {
    const amount = this.form.amountTo || '0'
    if (new BN(amount).eq(0)) return '0'
    const wallet = this.xstList
      .find(({ assetId }) => this.form.assetTo === assetId)
    const precision = isObject(wallet) as any ? wallet.precision : 18
    return new BN(amount).decimalPlaces(precision).toFormat(
      BN_FORMAT
    )
  }

  @Action createTransferAssetTransaction
  @Action getAssetRates
  @Action getBillingData

  walletByAsset (asset) {
    if (!asset.length) return {}

    const wallet = this.wallets
      .find(({ assetId }) => (asset === assetId))

    return wallet || {}
  }

  async selectAssetFrom (assetId) {
    if (this.form.assetTo === assetId) {
      this.form.assetTo = this.xstList[0].assetId
    }
    this.form.assetFrom = assetId
    await this.updateAssetRates()
    this.updateToFromAmount(this.form.amountTo)
  }

  async selectAssetTo (assetId) {
    this.form.assetTo = assetId
    await this.updateAssetRates()
    this.updateFromToAmount(this.form.amountFrom)
  }

  updateFromToAmount (amount: string) {
    if (amount === '.') return
    this.form.amountFrom = amount
    if (amount.length) {
      if (!this.xstWallet) return
      this.form.amountTo = new BN(amount).times(
        this.xstWalletRates
      ).toString()
    } else {
      this.form.amountTo = ''
    }
    this.$v.$touch()
  }

  updateToFromAmount (amount: string) {
    if (amount === '.') return
    this.form.amountTo = amount
    if (amount.length) {
      if (!this.xstWallet) return
      this.form.amountFrom = new BN(amount).div(
        this.xstWalletRates
      ).toString()
    } else {
      this.form.amountFrom = ''
    }
    this.$v.$touch()
  }

  swapWallets () {
    const { assetFrom, assetTo, amountFrom, amountTo } = this.form
    const isSwapable = this.wallets
      .some(({ assetId }) => assetId === assetTo)
    if (isSwapable) {
      this.form = {
        assetFrom: assetTo,
        assetTo: assetFrom,
        amountFrom: amountTo,
        amountTo: amountFrom
      }
      this.updateAssetRates()
    }
  }

  async updateAssetRates () {
    const USD = 'usd#xst'
    const { assetFrom, assetTo } = this.form
    const invertRates = (rate) => new BN(1).div(new BN(rate))
    if (assetFrom.length && assetTo.length) {
      try {
        const result = await this.getAssetRates({
          assets: [
            USD,
            this.form.assetTo
          ],
          base: this.form.assetFrom
        })
        this.rates = {
          [USD]: invertRates(result.rates[USD]),
          [this.form.assetTo]: invertRates(result.rates[this.form.assetTo])
        }
      } catch (error) {
        console.error('Error with update assets rates', error)
      }
    }
  }

  async updateBillingData () {
    const assetId = this.XOR
    if (!assetId.length) return
    const [, domain] = this.accountId.split('@')
    await this.getBillingData({
      asset: assetId,
      domain,
      billingType: BillingTypes.EXCHANGE
    })
  }

  async onSubmit () {
    this.$v.$touch()
    if (this.$v.$invalid) return

    this.isLoading = true

    try {
      const transaction = await this.createTransferAssetTransaction({
        assetId: this.form.assetFrom,
        to: EXCHANGE_ACCOUNT,
        description: this.form.assetTo,
        amount: this.form.amountFrom,
        fee: this.exchangeFeeAmount,
        feeType: FeeTypes.EXCHANGE
      })

      await this.$sendTransaction(
        transaction,
        () => this.accountQuorum > 1
          ? this.$message.warning('Exchange waiting for other signatures. Please continue signing on "Waiting tab"')
          : this.$message.success('Exchange successuflly send!')
      )
    } catch (error) {
      console.error(error)
    }

    this.isLoading = false
  }
}
</script>

<style scoped>
.exchange_block {
  height: 100%;
  background: white;
  padding: 4rem;
}
.exchange_block-row {
  display: grid;
  grid-template-columns: 1fr 0.3fr 1fr;
  grid-template-areas: ". . .";
  grid-column-gap: 10px;
  margin-bottom: 3rem;
}
.exchange_block-row.second {
  grid-template-columns: 1fr 0.1fr 1fr;
}
.exchange_form-item {
  height: 7rem;
  margin-bottom: 2rem;
}
.exchange_item {
  background-color: #F5F7F8;
  border-radius: 10px;
  padding: 1rem;
}
.exchange_item.small {
  background-color: unset;
  padding: 0;
}
.exchange_item-label {
  font-family: 'SoraB';
  font-size: 0.8rem;
  color: #75787B;
  text-transform: uppercase;
}
.exchange_item-asset {
  display: flex;
  font-size: 0.8rem;
  justify-content: flex-end;
  font-family: 'SoraSB';
}
.exchange_item-fee {
  display: flex;
  font-size: 0.7rem;
}
.exchange_item-price_block {
  display: grid;
  grid-template-columns: 0.15fr 1fr;
  grid-template-areas: ". .";
  align-items: center;
  padding: 0.2rem 0;
  height: 3.5rem;
}
.exchange_item-price_block .price {
  font-family: 'Sora';
  font-size: 1.5rem;
}
.exchange_label {
  font-family: 'SoraB';
  font-size: 0.9rem;
  line-height: 2.2;
}
.exchange_label-small {
  font-size: 0.8rem;
  line-height: 2.2;
}
.exchange_vertical {
  border-left: 1px solid #DDDDDD;
  height: 100%;
}
.exchange_vertical-icon {
  position: absolute;
  top: 38%;
  cursor: pointer;
}
</style>
