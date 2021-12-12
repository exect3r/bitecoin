<template>
  <div class="card card-body grid">
    <div v-for="(data, i) of generalData" :key="i" :class="'data' + i">
      <GeneralDataEntry :title="data.title" :img="data.img" :data="data.data" :tooltip="data.tooltip"/>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    generalData () {
      return [
        {
          title: 'Price',
          img: 'bitecoin.png',
          data: 'priceless',
          tooltip: 'This coin is meant for educational purposes only'
        },
        {
          title: 'Transactions',
          img: 'bitecoin.png',
          data: this.$store.state.transactionCount,
          tooltip: 'The number of confirmed transactions in the blockchain'
        },
        {
          title: 'Blocks',
          img: 'bitecoin.png',
          data: this.$store.state.blockCount,
          tooltip: 'The number of confirmed blocks in the blockchain'
        },
        {
          title: 'Difficulty',
          img: 'bitecoin.png',
          data: `${this.$store.state.hashDifficulty}`,
          tooltip: 'Calculated hashes need to be less than this value'
        }
      ]
    }
  }
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  grid-column-gap: 2em;
  grid-row-gap: 2em;
  width: 50%;
}

@media (max-width: 600px) {
  .grid {
    display: flex;
    flex-direction: row;
    width: 90%;
    overflow-x: scroll;
    scrollbar-width: 3px;
  }
}
</style>
