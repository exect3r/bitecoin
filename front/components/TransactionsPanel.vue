<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">
        <div>Latest Transactions</div>
      </div>
    </div>
    <div class="card-body">
      <div class="transaction" v-for="(trans, i) of transactions" :key="i">
        <template v-if="trans.type === 'regular'">
          <template v-if="trans.direction === 'in'">
            <div @click="copyAddr(trans.from)" class="sender">{{ shortAddr(trans.from) }}</div>
            <div class="arrow" />
            <div @click="copyAddr(trans.to)" class="receiver">{{ shortAddr(trans.to) }}</div>
          </template>
          <template v-else>
            <div @click="copyAddr(trans.to)" class="receiver">{{ shortAddr(trans.to) }}</div>
            <div class="arrow reversed" />
            <div @click="copyAddr(trans.from)" class="sender">{{ shortAddr(trans.from) }}</div>
          </template>
          <div class="line" />
          <div class="amount">{{ trans.amount }} BeTC</div>
        </template>
        <template v-else-if="trans.type === 'reward'">
          <div class="mining-reward" />
          <div class="receiver">{{ shortAddr(trans.to) }}</div>
          <div class="line" />
          <div class="amount">{{ trans.amount }} BeTC</div>
        </template>
        <template v-else>
          <!-- custom types -->
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    shortAddr (addr) {
      return addr.slice(0, 4) + '—' + addr.slice(-4)
    },
    copyAddr (addr) {
      console.log('copied', addr)
      navigator.clipboard.writeText(addr)
    }
  },
  computed: {
    transactions () {
      return [...this.$store.state.latestUserTransactions].reverse()
    }
  }
}
</script>

<style scoped>
.card-body {
  overflow-y: scroll;
  height: 0;
  min-height: 110%;
}

.card-body::-webkit-scrollbar {
  display: none;
}

.transaction {
  display: flex;
  margin-bottom: 1em;
}

.line {
  width: auto;
  border-top: 1px var(--clr-fg-dec) solid;
  transition: border-color var(--clr-trans-spd) var(--clr-trans-tf);
  transform: translateY(50%);
  flex: 1;
}

.arrow {
  width: 1.4em;
  height: 1.4em;
  mask: url('/right-arrow.svg');
  mask-repeat: no-repeat;
  background-color: red;
  margin-left: 1em;
  margin-right: 1em;
}

.reversed {
  transform: rotate(180deg);
  background-color: green;
}

.mining-reward {
  width: 1.4em;
  height: 1.4em;
  mask: url('/mining-icon.svg');
  mask-repeat: no-repeat;
  mask-size: contain;
  background-color: green;
  margin-right: .6em;
}

@media (max-width: 800px) {
  .card-body {
    overflow-y: scroll;
    height: 100%;
  }
}
</style>
