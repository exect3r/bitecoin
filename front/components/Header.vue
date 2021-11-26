<template>
  <header class="header center">
    <h3>
      <NuxtLink to="/" class="btn btn-icon">
        <img src="/bitecoin.png" width="64" height="64">
      </NuxtLink>
    </h3>
    <Navbar />
  </header>
</template>

<style>

.header {
  height: 8em;
  max-width: var(--page-width);
  width: 95%;
  margin: 0 auto;
  justify-content: space-between;
}

@media (max-width: 600px) {
  .header {
    height: 6em;
  }
}
</style>
