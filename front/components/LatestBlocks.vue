<template>
  <div class="card blocks">
    <div class="card-header">
      <div class="card-title">hi</div>
    </div>
    <div class="card-body entries">
      <BlockEntry v-for="(block, i) of latestBlocks" :key="i" :data="block" class="entry" />
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
