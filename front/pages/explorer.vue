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
export default {
  mounted () {
    this.$store.commit('activateBundle', 'explorer')
  },
  beforeDestroy () {
    this.$store.commit('disactivateBundle', 'explorer')
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
