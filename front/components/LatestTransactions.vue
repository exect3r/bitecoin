<template>
  <div class="card transactions">
    <div class="card-header">
      <div class="card-title">Latest Transactions</div>
    </div>
    <div class="card-body">
      <div v-if="latestTransactions.length > 0" class="entries">
        <TransactionEntry
          v-for="(trans, i) of latestTransactions"
          :key="i"
          :data="trans"
          class="entry"
        />
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
      return this.$store.state.latestTransactions
    }
  }
}
</script>

<style scoped>
.transactions {
  width: 100%;
}

.entries {
  overflow: hidden;
}

.entry:not(:last-child) {
  border-bottom: black 1px solid;
}
</style>
