<template>
  <div class="explorer">
    <GeneralData />
    <div class="latest-data">
      <LatestBlocks class="div1" />
      <LatestTransactions class="div2" />
    </div>
  </div>
</template>

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

.div1 {
  grid-area: 1 / 1 / 2 / 2;
}
.div2 {
  grid-area: 1 / 2 / 2 / 3;
}
</style>
