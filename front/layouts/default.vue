<template>
  <div id="top" class="app" :class="{ light: !darkMode, dark: darkMode }">
    <div class="background" />
    <Header />

    <main>
      <Nuxt />
    </main>
  </div>
</template>

<script>
export default {
  data () {
    setInterval(async () => {
      const a = await this.$axios.$get('/api/blockchain/blocks', { progress: false })
      this.$store.commit('setBlockCount', a.length)
    }, 1000)

    return {}
  },

  computed: {
    darkMode () {
      return this.$store.state.darkMode
    }
  }
}
</script>

<style scoped>
.app {
  font-family: "Poppins", sans-serif;
  line-height: 1.5;
  color: var(--clr-fg);
  transition: background-color 0.2s linear;
  background-color: var(--clr-bg);
  user-select: none;
}

.background {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transition: background-color 0.2s linear;
  background-color: var(--clr-bg);
  z-index: -300;
}

main {
  max-width: var(--page-width);
  margin: 0 auto;
}
</style>
