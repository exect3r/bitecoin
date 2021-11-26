<template>
  <nav class="center nav">
    <ul class="nav-list">
      <li class="nav-list-item">
        <NuxtLink to="/explorer" class="link link-nav">
          Explore
        </NuxtLink>
      </li>

      <li class="nav-list-item">
        <NuxtLink to="/wallet" class="link link-nav">
          Wallet
        </NuxtLink>
      </li>
    </ul>

    <button
      type="button"
      v-on:click="toggleTheme"
      class="btn btn-icon nav-theme"
      aria-label="toggle theme"
    >
      <svg v-if="darkMode" class="MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.05 4.14l-.39-.39c-.39-.39-1.02-.38-1.4 0l-.01.01c-.39.39-.39 1.02 0 1.4l.39.39c.39.39 1.01.39 1.4 0l.01-.01c.39-.38.39-1.02 0-1.4zM3.01 10.5H1.99c-.55 0-.99.44-.99.99v.01c0 .55.44.99.99.99H3c.56.01 1-.43 1-.98v-.01c0-.56-.44-1-.99-1zm9-9.95H12c-.56 0-1 .44-1 .99v.96c0 .55.44.99.99.99H12c.56.01 1-.43 1-.98v-.97c0-.55-.44-.99-.99-.99zm7.74 3.21c-.39-.39-1.02-.39-1.41-.01l-.39.39c-.39.39-.39 1.02 0 1.4l.01.01c.39.39 1.02.39 1.4 0l.39-.39c.39-.39.39-1.01 0-1.4zm-1.81 15.1l.39.39c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-.39-.39c-.39-.39-1.02-.38-1.4 0-.4.4-.4 1.02-.01 1.41zM20 11.49v.01c0 .55.44.99.99.99H22c.55 0 .99-.44.99-.99v-.01c0-.55-.44-.99-.99-.99h-1.01c-.55 0-.99.44-.99.99zM12 5.5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-.01 16.95H12c.55 0 .99-.44.99-.99v-.96c0-.55-.44-.99-.99-.99h-.01c-.55 0-.99.44-.99.99v.96c0 .55.44.99.99.99zm-7.74-3.21c.39.39 1.02.39 1.41 0l.39-.39c.39-.39.38-1.02 0-1.4l-.01-.01a.9959.9959 0 00-1.41 0l-.39.39c-.38.4-.38 1.02.01 1.41z"></path></svg>
      <svg v-else class="MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2z"></path></svg>
    </button>
  </nav>
</template>

<script>
export default {
  methods: {
    toggleTheme () {
      this.$store.commit('toggleDarkMode')
    }
  },
  computed: {
    darkMode () { return this.$store.state.darkMode }
  }
}
</script>

<style>
.nav-list {
  list-style-type: none;
  margin-right: 1.5em;
  display: flex;
}

.nav-list-item {
  margin-left: 1.5em;
}

.app .nav-hamburger {
  display: none;
}

.nav-theme {
  margin-top: 0.4em;
}

@media (max-width: 600px) {
  .nav-list {
    list-style-type: none;
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
  }
  .nav-list-item {
    margin: 0.5em 0;
  }
  .app .nav-hamburger {
    display: flex;
    z-index: 2;
    margin-left: 0.8em;
  }
}
</style>
