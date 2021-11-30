<template>
  <div class="explorer">
    <GeneralData />
    <div class="latest-data">
      <LatestBlocks />
      <LatestTransactions />
    </div>
  </div>
</template>

<script>
async function updateData () {
  const info = await this.$axios.$get('/api/blockchain/info', { progress: false })
  this.$store.commit('setBlockCount', info.blockCount)
  this.$store.commit('setTransactionCount', info.transactionCount)

  const blocks = await this.$axios.$get('/api/blockchain/blocks/0-10', { progress: false })
  this.$store.commit('setLatestBlocks', blocks)
  const transactions = await this.$axios.$get('/api/blockchain/transactions/0-10', { progress: false })
  this.$store.commit('setLatestTransactions', transactions)
}

export default {
  mounted () {
    updateData.bind(this)()
    this._interval = setInterval(updateData.bind(this), 1000)
  },

  destroyed () {
    clearInterval(this._interval)
  }
}
</script>

<style scoped>
.explorer {
  display: flex;
  flex-direction: column;
}

.latest-data {
  margin-top: 3em;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: 1fr;
  grid-column-gap: 1em;
}

@media (max-width: 800px) {
  .latest-data {
    margin-top: 3em;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: repeat(2, 1fr);
    grid-row-gap: 1em;
  }
}
</style>
