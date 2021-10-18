<template>
  <div>
    <div class="leftNavBar">
      <nav>
        <img src="~assets/telosLogo.svg" class="telosLogo" />
        <ul>
          <li>
            <a @click="$router.replace('/balance')" class=" wallet">
              <img src="~assets/wallet.svg" class="menuIcon" />Wallet</a
            >
          </li>
          <li>
            <a @click="$router.replace('/dappsearch')">
              <img src="~assets/dApps1.svg" class="menuIcon" />dApps</a
            >
          </li>
          <li>
            <a @click="tab = 'Coins'">
              <img src="~assets/coin.svg" class="menuIcon" />Coin</a
            >
          </li>
          <li>
            <a @click="tab = 'Collectables'">
              <img src="~assets/nft.svg" class="menuIcon" />Nft</a
            >
          </li>
          <li>
            <a @click="logout()"> <img icon="logout" />Logout</a>
          </li>
          <!-- <li> 
                    <a @click="$router.replace('/resources')" class=" wallet">
                    Resources</a>
                    <q-icon class="menuIcon fas fa-cogs" />
                </li> -->
        </ul>
      </nav>
    </div>
    <div class="bottomNavBar">
      <nav>
        <ul>
          <li>
            <a @click="$router.replace('/balance')" class="active wallet">
              <img src="~assets/wallet.svg" class="menuIcon"
            /></a>
          </li>
          <li>
            <a @click="$router.replace('/dappsearch')">
              <img src="~assets/dApps1.svg" class="menuIcon"
            /></a>
          </li>
          <li>
            <a @click="tab = 'Coins'">
              <img src="~assets/coin.svg" class="menuIcon"
            /></a>
          </li>
          <li>
            <a @click="tab = 'Collectables'">
              <img src="~assets/nft.svg" class="menuIcon"
            /></a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style lang="scss" scoped>
nav ul li a:hover {
  background: #e6e6e611;
  opacity: 100%;
}
</style>
