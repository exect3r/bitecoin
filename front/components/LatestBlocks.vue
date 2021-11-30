<template>
  <div class="card blocks">
    <div class="card-header">
      <div class="card-title">Latest Blocks</div>
    </div>
    <div class="card-body">
      <div v-if="latestBlocks.length > 0" class="entries">
        <BlockEntry v-for="(block, i) of latestBlocks" :key="i" :data="block" class="entry" />
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
    latestBlocks () {
      return this.$store.state.latestBlocks
    }
  }
}
</script>

<style scoped>
.blocks {
  width: 100%;
}

.entries {
  overflow: hidden;
}

.entry:not(:last-child) {
  border-bottom: black 1px solid;
}
</style>
