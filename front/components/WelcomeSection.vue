<template>
  <div class="welcome">
    <div class="text">
      <h2 class="section-title">Welcome to BiteCoin</h2>
      <p class="welcome-desc">
        BiteCoin is a fully functional cryptocurrency school project made as a practice for my Blockchain studies.
      </p>
    </div>
    <div class="img">
    </div>
  </div>
</template>

<style scoped>
.welcome {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
  margin-top: 2.8em;
}

.text {
  max-width: 30em;
}

.img {
  width: 32em;
  height: 32em;
  background-image: url('/miner.png');
  background-size: 100%;
}

.welcome-desc {
  font-size: 1.3rem;
  max-width: 600px;
  text-align: center;
}

@media (max-width: 600px) {
  .app .welcome {
    align-items: flex-start;
    margin-top: 2em;
  }
}
</style>
