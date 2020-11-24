<template>
  <div>
    <div class="info-cards">
      <div class="info-cards_card">
        <div class="info-cards_card-header">
          <span>{{ wallet.name }}</span>
        </div>
        <div class="info-cards_card-content">
          <el-tooltip
            :content="`${ amountWithPrecision } ${ wallet.asset }`"
            class="item"
            effect="dark"
            placement="top-start"
          >
            <h2 class="text-overflow">
              {{ amountWithPrecision }} {{ wallet.asset }}
            </h2>
          </el-tooltip>
        </div>
        <div class="info-cards_card-footer">
          <div
            role="button"
            :class="['card_actions-button', 'button', restrictedAsset ? 'disabled' : '']"
            @click="onOpenModal(modalTypes.TRANSFER)"
          >
            <SvgIcon
              icon-name="Arrow"
              icon-class="blue_arrow up"
              width="20"
              height="20"
              :icon-color="restrictedAsset ? iconColors.disabled : iconColors.active"
            >
              <BlueArrow />
            </SvgIcon>
            <span
              class="card_actions-button-text"
              data-cy="transfer"
            >Send</span>
          </div>
          <div
            role="button"
            :class="['card_actions-button', 'button', restrictedAsset ? 'disabled' : '']"
            @click="onOpenModal(modalTypes.RECEIVE)"
          >
            <SvgIcon
              icon-name="Arrow"
              icon-class="blue_arrow down"
              width="20"
              height="20"
              :icon-color="restrictedAsset ? iconColors.disabled : iconColors.active"
            >
              <BlueArrow />
            </SvgIcon>
            <span
              class="card_actions-button-text"
              data-cy="receive"
            >Receive</span>
          </div>
          <div
            v-if="isAvaliableAction && accountEthAddress.length"
            role="button"
            :class="['card_actions-button', 'button', restrictedAsset ? 'disabled' : '']"
            @click="onOpenModal(modalTypes.WITHDRAWAL)"
          >
            <SvgIcon
              icon-name="Arrow"
              icon-class="blue_arrow right"
              width="20"
              height="20"
              :icon-color="restrictedAsset ? iconColors.disabled : iconColors.active"
            >
              <BlueArrow />
            </SvgIcon>
            <span
              class="card_actions-button-text"
              data-cy="withdraw"
            >Withdraw</span>
          </div>
          <div
            v-if="isAvaliableAction"
            role="button"
            :class="['card_actions-button', 'button', restrictedAsset ? 'disabled' : '']"
            @click="onOpenModal(modalTypes.DEPOSIT)"
          >
            <SvgIcon
              icon-name="Arrow"
              icon-class="blue_arrow left"
              width="20"
              height="20"
              :icon-color="restrictedAsset ? iconColors.disabled : iconColors.active"
            >
              <BlueArrow />
            </SvgIcon>
            <span
              class="card_actions-button-text"
              data-cy="deposit"
            >Deposit</span>
          </div>
        </div>
      </div>
      <div
        v-show="false"
        class="info-cards_card"
      >
        <div class="info-cards_card-header">
          <span>Market</span>
          <div class="info-cards_card-header-filter">
            <div
              v-for="period in marketPeriods"
              :key="period.type"
              :class="[selectedMarketPeriod !== period.type ? '' : 'selected']"
              @click="selectedMarketPeriod = period.type"
            >
              <p class="info-cards_card-header-filter_value">
                <b>{{ period.label }}</b>
              </p>
            </div>
          </div>
        </div>
        <div class="info-cards_card-content">
          <div
            v-loading="cryptoInfo.isLoading"
            class="info-cards_card-content-info"
          >
            <div class="info-cards_card-content-info_first">
              <p
                :title="`Current price of 1 ${wallet.asset} in ${settingsView.fiat}`"
                class="card-info-amount"
              >
                <b>{{ cryptoInfo.current.fiat | formatNumberLong }} {{ currencySymbol }}</b>
              </p>
              <p
                :title="`Change (${settingsView.fiat}) from ${selectedMarketPeriod} ago`"
                class="card-info-amount-change"
              >
                <img
                  v-if="cryptoInfo.current.fiatChange >= 0"
                  src="@/assets/wallet/arrow-up.svg"
                >
                <img
                  v-else
                  src="@/assets/wallet/arrow-down.svg"
                >
                {{ cryptoInfo.current.fiatChange | formatNumberShort }}
              </p>
            </div>
            <div class="info-cards_card-content-info_last">
              <p
                :title="`Current price of 1 ${wallet.asset} in ${settingsView.crypto}`"
                class="card-info-amount"
              >
                <b>{{ cryptoInfo.current.crypto | formatNumberLong }} {{ settingsView.crypto }}</b>
              </p>
              <p
                :title="`Change (%) from ${selectedMarketPeriod} ago`"
                class="card-info-amount-change"
              >
                <img
                  v-if="cryptoInfo.current.cryptoChange >= 0"
                  src="@/assets/wallet/arrow-up.svg"
                >
                <img
                  v-else
                  src="@/assets/wallet/arrow-down.svg"
                >
                {{ cryptoInfo.current.cryptoChange | formatPercent }}
              </p>
            </div>
          </div>
        </div>
        <div class="info-cards_card-footer">
          <div class="info-cards_card-footer-market">
            <p class="market-title">
              Market Cap
            </p>
            <p
              :title="`Market cap in ${settingsView.fiat}`"
              class="market-value"
            >
              {{ cryptoInfo.market.cap.fiat | formatNumberShort }} {{ currencySymbol }}
            </p>
            <p
              :title="`Market cap in ${wallet.asset}`"
              class="market-value"
            >
              {{ cryptoInfo.market.cap.crypto | formatNumberShort }} {{ wallet.asset }}
            </p>
          </div>
          <div class="info-cards_card-footer-market">
            <p class="market-title">
              Volume ({{ selectedMarketPeriod }})
            </p>
            <p
              :title="`Amount ${wallet.asset} has been traded in ${selectedMarketPeriod} against ALL its trading pairs, in terms of ${settingsView.fiat}`"
              class="market-value"
            >
              {{ cryptoInfo.market.volume.fiat | formatNumberShort }} {{ currencySymbol }}
            </p>
            <p
              :title="`Amount ${wallet.asset} has been traded in ${selectedMarketPeriod} against ALL its trading pairs, in terms of ${wallet.asset}`"
              class="market-value"
            >
              {{ cryptoInfo.market.volume.crypto | formatNumberShort }} {{ wallet.asset }}
            </p>
          </div>
          <div class="info-cards_card-footer-market">
            <p class="market-title">
              Circulating Supply
            </p>
            <p
              :title="`Total supply in ${wallet.asset}`"
              class="market-value"
            >
              {{ cryptoInfo.market.supply | formatNumberShort }} {{ wallet.asset }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <deposit-modal
      :is-visible.sync="isDepositModalVisible"
      :wallet="wallet"
    />
    <receive-modal
      :is-visible.sync="isReceiveModalVisible"
      :wallet="wallet"
    />
    <transfer-modal
      :is-visible.sync="isTransferModalVisible"
      :wallet="wallet"
      @update-history="$emit('update-history')"
    />
    <withdrawal-modal
      :is-visible.sync="isWithdrawalModalVisible"
      :wallet="wallet"
      @update-history="$emit('update-history')"
    />
  </div>
</template>

<script lang="ts">
import { lazyComponent } from '@/router'
import AssetIcon from '@/components/common/AssetIcon.vue'
import SvgIcon from '@/components/common/SvgIcon.vue'

import BlueArrow from '@/assets/wallet/blue-arrow.vue'

import numberFormat from '@/components/mixins/numberFormat'
import currencySymbol from '@/components/mixins/currencySymbol'
import { BillingTypes } from '@/data/consts'

import { Component, Prop, Watch, Mixins } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'

import BN from 'bignumber.js'

const MODAL_TYPES = {
  DEPOSIT: 'DEPOSIT',
  RECEIVE: 'RECEIVE',
  TRANSFER: 'TRANSFER',
  WITHDRAWAL: 'WITHDRAWAL',
  SIGN: 'SIGN'
}

enum ICON_COLORS {
  active = '#1B8BFF',
  disabled = '#95CAFF'
}

interface Wallet {
  amount: number;
  assetId: string;
  asset: string;
  billingId: string;
}

@Component({
  components: {
    AssetIcon,
    DepositModal: lazyComponent('Wallets/components/modals/DepositModal'),
    ReceiveModal: lazyComponent('Wallets/components/modals/ReceiveModal'),
    TransferModal: lazyComponent('Wallets/components/modals/TransferModal'),
    WithdrawalModal: lazyComponent('Wallets/components/modals/WithdrawalModal'),

    SvgIcon,
    BlueArrow
  }
})
export default class InfoCards extends Mixins(
  numberFormat,
  currencySymbol
) {
  @Prop(Object) readonly wallet!: Wallet

  iconColors = ICON_COLORS
  modalTypes = MODAL_TYPES
  isDepositModalVisible = false
  isReceiveModalVisible = false
  isTransferModalVisible = false
  isWithdrawalModalVisible = false
  marketPeriods = [
    { label: 'TODAY', type: '1D' },
    { label: 'MONTH', type: '1M' }
  ]
  selectedMarketPeriod = '1D'

  @Getter accountId
  @Getter cryptoInfo
  @Getter settingsView
  @Getter ethMasterContractAddress
  @Getter accountEthAddress

  get amountWithPrecision () {
    return numberFormat.filter('formatPrecision')(this.wallet.amount)
  }
  get restrictedAsset () {
    return ['xor#sora'].includes(this.wallet.assetId)
  }
  get isAvaliableAction () {
    const assetDomain = this.wallet.assetId.split('#')[1]
    const allowedDomains = [
      'ethereum',
      'sora'
    ]

    if (allowedDomains.includes(assetDomain)) {
      return true
    }

    return false
  }

  @Watch('selectedMarketPeriod')
  watchSelectedMarketPeriod () {
    this.updateMarketCard()
  }

  created () {
    this.updateMarketCard()
  }

  @Action getAssetPrecision
  @Action getCryptoFullData
  @Action openApprovalDialog
  @Action getBillingData

  requestDataBeforeOpen () {
    this.getAssetPrecision(this.wallet.assetId)
  }

  onOpenModal (modalType) {
    if (this.restrictedAsset) return

    this.requestDataBeforeOpen()
    if (modalType === this.modalTypes.DEPOSIT) {
      this.isDepositModalVisible = true
    }
    if (modalType === this.modalTypes.RECEIVE) {
      this.isReceiveModalVisible = true
    }
    if (modalType === this.modalTypes.WITHDRAWAL) {
      const [, domain] = this.accountId.split('@')
      this.getBillingData({ asset: this.wallet.assetId, domain, billingType: BillingTypes.WITHDRAWAL })
      this.isWithdrawalModalVisible = true
    }
    if (modalType === this.modalTypes.TRANSFER) {
      const [, domain] = this.accountId.split('@')
      this.getBillingData({ asset: this.wallet.assetId, domain, billingType: BillingTypes.TRANSFER })
      this.isTransferModalVisible = true
    }
  }

  updateMarketCard () {
    return this.getCryptoFullData({
      filter: this.selectedMarketPeriod,
      asset: this.wallet.asset,
      billingId: this.wallet.billingId
    })
  }
}
</script>

<style scoped>
.info-cards {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-template-areas: ".";
  border-bottom: 0.5px solid #E5E5E5;
}
.info-cards > .info-cards_card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: #ffffff;
  height: 12rem;
  width: 100%;
  overflow: hidden;
  border-right: 0.5px solid #E5E5E5;
}
.info-cards > .info-cards_card > .info-cards_card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 3rem;
  border-bottom: 0.5px solid #E5E5E5;
  font-weight: 600;
}
.info-cards > .info-cards_card > .info-cards_card-header .info-cards_card-header-filter {
  display: flex;
  color: rgba(0, 0, 0, 0.4);
  font-size: 0.7rem;
  cursor: pointer;
}
.info-cards > .info-cards_card > .info-cards_card-header .info-cards_card-header-filter .selected {
  color: #1B8BFF;
}
.info-cards > .info-cards_card > .info-cards_card-header .info-cards_card-header-filter_value {
  margin: 0 0.5rem;
}
.info-cards > .info-cards_card > .info-cards_card-content {
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  height: 3rem;
}
.info-cards > .info-cards_card > .info-cards_card-content .info-cards_card-content-info {
  display: flex;
}
.info-cards > .info-cards_card > .info-cards_card-content .info-cards_card-content-info .card-info-amount-change {
  font-size: 0.85rem;
}
.info-cards > .info-cards_card > .info-cards_card-content .info-cards_card-content-info_last {
  margin-left: 10rem;
}
.info-cards > .info-cards_card > .info-cards_card-footer {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-areas: ". . . .";
  padding: 0.5rem 1.5rem;
  justify-items: center;
}
.info-cards > .info-cards_card > .info-cards_card-footer > .card_actions-button {
  display: flex;
  align-items: center;
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #1B8BFF;
  height: 2rem;
  cursor: pointer;
}
.info-cards > .info-cards_card > .info-cards_card-footer .card_actions-button-text {
  margin-left: 0.5rem;
}
.info-cards > .info-cards_card > .info-cards_card-footer .disabled .card_actions-button-text {
  color: #95caff;
}
.info-cards > .info-cards_card > .info-cards_card-footer .info-cards_card-footer-market {
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
  line-height: 1.5;
}
.info-cards_card-footer-market > .market-title {
  color: rgba(0, 0, 0, 0.5);
}
.info-cards_card-footer-market > .market-value {
  font-weight: 600;
}

@media screen and (max-width: 1149px) {
  .info-cards {
    flex-direction: column;
  }
}
</style>
