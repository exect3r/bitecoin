<template>
  <div>
    <WelcomeSection />
    <StatsSection />
  </div>
</template>

<script>
export default {
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
