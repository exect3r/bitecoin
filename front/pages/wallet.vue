<template>
  <div class="grid">
    <div class="card wallet">
      <div class="card-header">
        <div class="card-title wallet-info">
          <div>Wallet - {{ email }}</div>
          <div>{{ balance }}</div>
        </div>
      </div>
      <div class="card-body">
        <h5>Addresses:</h5>
        <div class="address-book">
          <template v-if="addresses.length > 0">
          <div class="address" v-for="(addr, i) in addresses" :key="i">
            <div>{{ shortAddr(addr) }}</div>
            <div>{{ addrBalance(addr) }}</div>
          </div>
          </template>
          <div v-else>none</div>
          <div class="btn btn-outline add-btn" @click="addAddress">Add</div>
        </div>
      </div>
    </div>
    <div class="card wallet">
      <div class="card-header">
        <div class="card-title">
          <div>Latest Transactions</div>
        </div>
      </div>
      <div class="card-body">hi</div>
    </div>
    <div class="card mining">
      <div class="card-header">
        <div class="card-title">
          <div>Mining</div>
        </div>
      </div>
      <div class="card-body">hi</div>
    </div>
  </div>
</template>

<script>
function getBalance () {
  this.$axios.get('/api/teller/wallet/balance', { progress: false }).then((res) => {
    this.balance = res.data.balance
  }).catch((err) => {
    console.log(err.response.data.error)
  })
}

export default {
  middleware: 'auth',
  data () {
    return {
      email: this.$auth.user.email,
      balance: 0,
      addresses: []
    }
  },
  methods: {
    addAddress () {
      this.$axios.$post('/api/teller/wallet/addresses', { progress: false }).then(
        (res) => { this.addresses.push(res.address) }
      ).catch((err) => {
        console.log(err.response.body.error)
      })
    },
    addrBalance (addr) {
      return 0
    },
    shortAddr (addr) {
      return addr.slice(0, 4) + '...' + addr.slice(-4)
    }
  },
  mounted () {
    getBalance.bind(this)()
    this._interval = setInterval(getBalance.bind(this), 5000)
    this.$axios.$get('/api/teller/wallet/addresses', { progress: false }).then(
      (res) => { this.addresses = res.addresses }
    ).catch((err) => {
      console.log(err.response.body.error)
    })
  },
  beforeDestroy () {
    clearInterval(this._interval)
  }
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  grid-template-rows: 1fr;
  grid-column-gap: 1em;
  grid-row-gap: 1em;
}

.mining {
  grid-area: 2 / 1 / 3 / 3;
}

.address-book {
  margin-top: .6em;
}

.address {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-left: .8em;
}

.add-btn {
  margin-top: 1em;
}

.card {
  width: 100%;
}

.wallet-info {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(3, 1fr);
  }

  .mining {
    grid-area: auto;
  }
}
</style>
