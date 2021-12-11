<template>
  <div class="card card-body">
    <div class="block-data">
      <div class="entry">
        <div class="data">
          <div class="key">
            Hash
          </div>
          <div class="value">
            {{ block.hash }}
          </div>
        </div>
      </div>
      <div class="entry">
        <div class="data">
          <div class="key">
            Height
          </div>
          <div class="value">
            {{ block.index }}
          </div>
        </div>
      </div>
      <div class="entry">
        <div class="data">
          <div class="key">
            Nonce
          </div>
          <div class="value">
            {{ block.nonce }}
          </div>
        </div>
      </div>
      <div class="entry">
        <div class="data">
          <div class="key">
            Timestamp
          </div>
          <div class="value">
            {{ new Date(block.timestamp).toGMTString() }}
          </div>
        </div>
      </div>
      <div class="entry">
        <div class="data">
          <div class="key">
            Miner
          </div>
          <div class="value">
            {{ block.miner || '???' }}
          </div>
        </div>
      </div>
      <div class="entry">
        <div class="data">
          <div class="key">
            Transactions
          </div>
          <div class="value">
            {{ (block.transactions || {}).length }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      block: {}
    }
  },
  async created () {
    this.block = await this.$axios.$get('/api/blockchain/blocks/' + this.$route.query.hash)
    console.log(this.block)
  }
}
</script>

<style scoped>
.block-data {
  overflow: hidden;
}

.entry:not(:first-child) {
  margin-top: 1em;
}

.entry:not(:last-child) {
  margin-bottom: 1em;
}

.block-data .entry::after {
  content: '';
  display: inline-block;
  border-top: 1px solid var(--clr-bg-dec);
  transition: border-color var(--clr-trans-spd) var(--clr-trans-tf);
  transform: translateY(-.8em);
  width: 100%;
}

.data {
  display: flex;
  flex-direction: row;
}

.key {
  width: 50%;
  text-overflow: ellipsis;
  overflow: hidden;
}

.value {
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
}

.card-body {
  width: 80%;
}
</style>
