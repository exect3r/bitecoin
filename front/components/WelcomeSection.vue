<template>
  <div class="welcome">
    <div class="text">
      <h2 class="section-title">Welcome to BiteCoin</h2>
      <p class="welcome-desc">
        BiteCoin is a small cryptocurrency project to practice my Blockchain studies.
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
  background-repeat: no-repeat;
  background-position: center;
}

.welcome-desc {
  font-size: 1.3rem;
  max-width: 600px;
  text-align: center;
}

@media (max-width: 600px) {
  .welcome {
    align-items: flex-start;
    margin-top: 2em;
  }

  .img {
    display: none;
  }
}
</style>
