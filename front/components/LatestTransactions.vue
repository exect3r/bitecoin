<template>
  <div class="card transactions">
    <div class="card-header">
      <div class="card-title">Latest Transactions</div>
    </div>
    <div class="card-body">
      <div v-if="latestTransactions.length > 0" class="trans-data">
        <div v-for="(trans, i) of latestTransactions" :key="i" class="entry">
          <div class="data">
            <div class="entry-hash">
              <NuxtLink class="n-link" :to="{ path: '/transaction', query: {hash: trans.hash} }">
                {{ shortHash(trans.id) }}
              </NuxtLink>
            </div>
            <div class="entry-date">
              {{ amount(trans) }} BeTC
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        none
      </div>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    latestTransactions () {
      return [...this.$store.state.latestTransactions].reverse()
    }
  },
  methods: {
    shortHash (hash) {
      return hash.slice(0, 4) + '—' + hash.slice(-4)
    },
    amount (trans) {
      return trans.data.outputs.filter(tx => !trans.data.inputs.find(txIn => txIn.address === tx.address))
        .map(tx => tx.amount).reduce((a1, a2) => a1 + a2, 0)
    }
  }
}
</script>

<style scoped>
.transactions {
  width: 100%;
}

.trans-data {
  overflow: hidden;
}

.trans-data .entry::after {
  content: '';
  display: inline-block;
  border-top: 1px solid var(--clr-bg-dec);
  transition: border-color var(--clr-trans-spd) var(--clr-trans-tf);
  transform: translateY(-.8em);
  width: 100%;
}

.data {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>
