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
  transition: background-color var(--clr-trans-spd) var(--clr-trans-tf);
  background-color: var(--clr-bg);
  user-select: none;
  max-width: 90%;
  margin: auto;
}

@media (max-width: 600) {
  .app {
    font-family: "Poppins", sans-serif;
    line-height: 1.5;
    color: var(--clr-fg);
    transition: background-color var(--clr-trans-spd) var(--clr-trans-tf);
    background-color: var(--clr-bg);
    user-select: none;
    margin: auto;
  }
}

.background {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transition: background-color var(--clr-trans-spd) var(--clr-trans-tf);
  background-color: var(--clr-bg);
  z-index: -300;
}

main {
  max-width: var(--page-width);
  margin: 0 auto;
}
</style>
