<template>
  <div class="card blocks">
    <div class="card-header">
      <div class="card-title">Latest Blocks</div>
    </div>
    <div class="card-body">
      <div v-if="latestBlocks.length > 0" class="block-data">
        <div v-for="(block, i) of latestBlocks" :key="i" class="entry">
          <div class="data">
            <div class="entry-hash">
              <NuxtLink :to="{ path: '/block', query: {hash: block.hash} }">
                {{ shortHash(block.hash) }}
              </NuxtLink>
            </div>
            <div class="entry-date">
              {{ elapsedTime(block.timestamp) }}
            </div>
          </div>
        </div>
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
      return [...this.$store.state.latestBlocks].reverse()
    }
  },
  methods: {
    shortHash (hash) {
      return hash.slice(0, 4) + '—' + hash.slice(-4)
    },
    elapsedTime (timestamp) {
      const time = Date.now() - timestamp
      if (time < 1000) {
        return 'just now'
      } else if (time < 60000) {
        return new Date(time).getSeconds() + 's ago'
      } else if (time < 3600000) {
        return new Date(time).getMinutes() + 'm ago'
      } else if (time < 86400000) {
        return new Date(time).getHours() + 'h ago'
      } else {
        return 'a long time ago'
      }
    }
  }
}
</script>

<style scoped>
.blocks {
  width: 100%;
}

.block-data {
  overflow: hidden;
}

.block-data .entry::after {
  content: '';
  display: inline-block;
  border-top: 1px solid var(--clr-bg-dec);
  transition: border-color var(--clr-trans-spd) var(--clr-trans-tf);
  transform: translateY(-.8em);
  width: 100%;
}

.data {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>
