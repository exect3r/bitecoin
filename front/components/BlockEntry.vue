<template>
  <div class="entry">
    <div class="entry-hash">
      <NuxtLink :to="{ path: '/block', query: {hash: data.hash} }">
        {{ shortHash }}
      </NuxtLink>
    </div>
    <div class="entry-date">
      {{ elapsedTime }}
    </div>
  </div>
</template>

<script>
export default {
  props: ['data'],

  computed: {
    shortHash () {
      return this.data.hash.slice(0, 4) + '...' + this.data.hash.slice(-4)
    },

    elapsedTime () {
      const time = Date.now() - this.data.timestamp
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
.entry {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>
