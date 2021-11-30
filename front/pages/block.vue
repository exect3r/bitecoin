<template>
  <div>
    hi
  </div>
</template>

<script>
export default {
  async mounted () {
    const block = await this.$axios.$get('/api/blockchain/blocks/' + this.$route.query.hash)
    console.log(block)
  }
}
</script>
