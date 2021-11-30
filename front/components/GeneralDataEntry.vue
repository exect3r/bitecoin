<template>
  <div class="entry">
    <div class="icon" :style="'background-image: url(' + img + ');'" />
    <div class="data-panel">
      <span class="title">{{ title }}</span>
      <span class="data">{{ data }}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: ['title', 'img', 'data']
}
</script>

<style scoped>
.entry {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.icon {
  margin-right: 1em;
  background-size: 100%;
  background-repeat: no-repeat;
  width: 2.8em;
  height: 2.8em;
  min-width: 2.8em;
}

.data-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>
