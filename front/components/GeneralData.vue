<template>
  <div class="card card-body grid">
    <div v-for="(data, i) of generalData" :key="i" :class="'data' + i">
      <GeneralDataEntry :title="data.title" :img="data.img" :data="data.data"/>
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
          data: 'priceless'
        },
        {
          title: 'Transactions',
          img: 'bitecoin.png',
          data: this.$store.state.transactionCount
        },
        {
          title: 'Blocks',
          img: 'bitecoin.png',
          data: this.$store.state.blockCount
        },
        {
          title: 'Difficulty',
          img: 'bitecoin.png',
          data: `${this.$store.state.hashDifficulty}`
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
