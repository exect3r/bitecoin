<template>
  <div class="grid">
    <div class="card wallet">
      <div class="card-header">
        <div class="card-title wallet-info">
          <div>Wallet - {{ email }}</div>
          <div>{{ balance }} BeTC</div>
        </div>
      </div>
      <div class="card-body">
        <h5>Addresses:</h5>
        <div class="address-book">
          <div v-if="addresses.length > 0" class="mb-1">
          <div class="address" v-for="(addr, i) in addresses" :key="i">
            <div @click="copyAddr(addr)">{{ shortAddr(addr) }}</div>
            <div>{{ balances[addr] }} BeTC</div>
          </div>
          </div>
          <div v-else class="mb-1">none</div>
          <div class="btn btn-outline text-center" @click="addAddress">Create Address</div>
        </div>
      </div>
    </div>
    <TransactionsPanel class="trans-history"/>
    <SendingPanel class="trans-panel" />
    <MiningPanel class="mining-panel" />
  </div>
</template>

<script>
export default {
  middleware: 'auth',
  data () {
    return {
      email: this.$auth.user.email
    }
  },
  mounted () {
    this.$store.commit('activateBundle', 'wallet')
  },
  beforeDestroy () {
    this.$store.commit('disactivateBundle', 'wallet')
  },
  methods: {
    addAddress () {
      this.$axios.$post('/api/teller/wallet/addresses', { progress: false }).then(
        (res) => { this.addresses.push(res.address) }
      ).catch((err) => {
        console.log(err.response.data.error)
      })
    },
    shortAddr (addr) {
      return addr.slice(0, 4) + '—' + addr.slice(-4)
    },
    copyAddr (addr) {
      console.log('copied', addr)
      navigator.clipboard.writeText(addr)
    }
  },
  computed: {
    balance () {
      return this.$store.state.balance || 0
    },
    balances () {
      return this.$store.state.addresses
    },
    addresses () {
      return Object.keys(this.$store.state.addresses)
    }
  }
}
</script>

<style scoped>
.text-center {
  text-align: center;
}
.grid {
  display: grid;
  grid-template-columns: 1fr .15fr .15fr 1fr;
  grid-template-rows: 1fr;
  grid-column-gap: 1em;
  grid-row-gap: 1em;
}

.trans-history {
  grid-area: 1 / 2 / 2 / 5;
}

.trans-panel {
  grid-area: 2 / 1 / 3 / 3;
}

.mining-panel {
  grid-area: 2 / 3 / 3 / 5;
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
    grid-template-rows: repeat(4, auto);
  }

  .trans-history {
    grid-area: auto;
  }

  .trans-panel {
    grid-area: auto;
  }

  .mining-panel {
    grid-area: auto;
  }
}
</style>
