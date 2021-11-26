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
          title: 'Bitecoin price',
          img: 'bitecoin.png',
          data: '$69'
        },
        {
          title: 'Transactions',
          img: 'bitecoin.png',
          data: '420'
        },
        {
          title: 'Blocks',
          img: 'bitecoin.png',
          data: this.$store.state.blockCount
        },
        {
          title: 'Difficulty',
          img: 'bitecoin.png',
          data: '1H'
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

.data0 { grid-area: 1 / 1 / 2 / 2; }
.data1 { grid-area: 1 / 2 / 2 / 3; }
.data2 { grid-area: 2 / 1 / 3 / 2; }
.data3 { grid-area: 2 / 2 / 3 / 3; }
</style>
