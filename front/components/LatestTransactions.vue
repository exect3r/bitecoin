<template>
  <div class="card transactions">
    <div class="card-header">
      <div class="card-title">hi</div>
    </div>
    <div class="card-body entries">
      <TransactionEntry v-for="(block, i) of latestBlocks" :key="i" :data="block" class="entry" />
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    latestBlocks () {
      return []
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
