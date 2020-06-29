<template class="menu">
  <div>
    <el-menu
      :router="true"
      class="el-side-menu"
      text-color="#ffffff"
      background-color="#1e1e1e"
      active-text-color="#000"
    >
      <div
        class="logo"
      >
        <img
          src="@/assets/Sora.svg"
          alt="Sora"
        >
      </div>
      <el-menu-item
        index="/wallets"
      >
        <SvgIcon
          icon-name="Wallet"
          icon-class="menu-icon"
        >
          <WalletIcon />
        </SvgIcon>
        <span
          slot="title"
          class="title-left"
        >Wallets</span>
      </el-menu-item>
      <el-menu-item
        index="/exchange"
      >
        <SvgIcon
          icon-name="Wallet"
          icon-class="menu-icon"
        >
          <ExchangeIcon />
        </SvgIcon>
        <span
          slot="title"
          class="title-left"
        >Exchange</span>
      </el-menu-item>
      <el-menu-item
        index="/transactions"
      >
        <el-badge
          v-if="pendingTransactionsAmount"
          :value="pendingTransactionsAmount"
          :max="9"
          :class="[isMenuActive('transactions') ? 'badge active' : 'badge']"
        >
          <SvgIcon
            icon-name="Transaction"
            icon-class="menu-icon"
          >
            <TransactionsIcon />
          </SvgIcon>
        </el-badge>
        <SvgIcon
          v-else
          icon-name="Transaction"
          icon-class="menu-icon"
        >
          <TransactionsIcon />
        </SvgIcon>
        <span
          slot="title"
          class="title-left"
        >Waitings</span>
      </el-menu-item>
      <el-menu-item index="/settings">
        <SvgIcon
          icon-name="Settings"
          icon-class="menu-icon"
        >
          <SettingsIcon />
        </SvgIcon>
        <span
          slot="title"
          class="title-left"
        >Settings</span>
      </el-menu-item>
      <el-menu-item
        class="bottom-icon"
        index="/logout"
        @click="onLogout"
      >
        <SvgIcon
          icon-name="Logout"
          icon-class="menu-icon"
        >
          <LogoutIcon />
        </SvgIcon>
        <span
          slot="title"
          class="title-left"
        >Logout</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script lang="ts">
import SettingsIcon from '@/assets/menu/settings.vue'
import TransactionsIcon from '@/assets/menu/transactions.vue'
import WalletIcon from '@/assets/menu/wallet.vue'
import ExchangeIcon from '@/assets/menu/exchange.vue'
import LogoutIcon from '@/assets/menu/logout.vue'
import SvgIcon from '@/components/common/SvgIcon.vue'

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'

@Component({
  components: {
    SettingsIcon,
    TransactionsIcon,
    WalletIcon,
    ExchangeIcon,
    LogoutIcon,
    SvgIcon
  }
})
export default class Menu extends Vue {
  isCollapsed = true

  @Getter pendingTransactions

  get currentActiveMenu () {
    if (this.$route.path.includes('wallets')) return '/wallets'
    if (this.$route.path.includes('settlements')) return '/settlements/history'
    return this.$route.path
  }
  get pendingTransactionsAmount () {
    return this.pendingTransactions.length
  }

  @Watch('isCollapsed')
  watchIsCollapsed (value) {
    if (!value) this.getAllUnsignedTransactions()
  }

  @Action logout
  @Action getAllUnsignedTransactions

  onLogout () {
    this.logout()
      .then(() => this.$router.push('/login'))
  }
  isMenuActive (path) {
    return this.$route.path.includes(path)
  }
}
</script>

<style scoped>
.logo {
  margin-bottom: 30px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.logo img {
  display: flex;
  align-self: center;
  height: 50px;
  width: 50px;
}
.el-side-menu {
  min-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width .3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border-right: none;
  z-index: 100;
  /* Getting rid of element.ui styles */
  position: fixed !important;
  border-right: none !important;
}
.el-side-menu:not(.el-menu--collapse) {
  width: 160px;
}
.el-menu-item {
  padding-left: 20px !important;
}
.el-side-menu > .el-menu-item.is-active,
.el-submenu .el-menu-item.is-active {
  background: white !important;
  color: black;
  font-weight: 500;
}
.el-menu-item.is-active .menu-icon {
  margin-right: 8px;
  text-align: center;
  color: #000000;
}
.menu-icon {
  margin-right: 8px;
  text-align: center;
  color: #ffffff;
}
.bottom-icon {
  position: absolute;
  bottom: 0;
  width: 100%
}
.title-left {
  margin-left: 1rem;
}
.badge {
  display: inline-flex;
  font-weight: bold;
}
.badge >>> .el-badge__content {
    margin-right: 0.5rem;
    background-color: #ffffff;
    border-radius: 0.2rem;
    color: #000000;
    height: 1.2rem;
    width: 1.2rem;
    line-height: 1.2rem;
    padding: 0;
    border: none;
}
.badge.active >>> .el-badge__content {
    background-color: #000000;
    color: #ffffff;
}
</style>
