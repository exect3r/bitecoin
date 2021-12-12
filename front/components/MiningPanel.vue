<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">
        <div>Mining</div>
      </div>
    </div>
    <div class="card-body panel">
      <div class="mb-1">
        <div class="label">
          Mining Address
          <div v-if="adrError" class="error">{{ adrError }}</div>
        </div>
        <select class="input" v-model="selectedAddr" @change="adrError = undefined" :class="{'input-error': adrError}">
          <option v-for="(addr, i) in addresses" :key="i" :value="addr">
            {{ addr }}
          </option>
        </select>
      </div>
      <div class="mb-1 block-data">
        <div class="entry">
          <div class="data">
            <div>Block index:</div>
            <div>{{currentBlock ? currentBlock.index : 'none'}}</div>
          </div>
        </div>
        <div class="entry">
          <div class="data">
            <div>Block transaction count:</div>
            <div>{{currentBlock ? currentBlock.transactions.length : 'none'}}</div>
          </div>
        </div>
        <div class="entry">
          <div class="data">
            <div>Block size:</div>
            <div>{{currentBlock ? blockSize : 0}} bytes</div>
          </div>
        </div>
        <div class="entry">
          <div class="data">
            <div>Current Hashrate:</div>
            <div v-tooltip="'Hashes per second'">{{(currentBlock ? hashPower : 0).toFixed(0)}} Hs</div>
          </div>
        </div>
      </div>
      <div class="mt-auto">
        <div v-if="mineErr" class="error">{{ mineErr }}</div>
        <button class="btn btn-outline w-100" :class="{disabled: !canMine}" @click="startMining">Start</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      selectedAddr: undefined,
      adrError: undefined,
      currentBlock: undefined,
      hashPower: 0,
      mineErr: undefined
    }
  },
  computed: {
    canMine () {
      return this.selectedAddr
    },
    blockSize () {
      return (this.currentBlock.index + this.currentBlock.previousHash +
        this.currentBlock.timestamp + JSON.stringify(this.currentBlock.transactions) + this.currentBlock.nonce).length
    },
    addresses () {
      return Object.keys(this.$store.state.addresses)
    }
  },
  methods: {
    async hash (message) {
      const msgBuffer = new TextEncoder().encode(message)
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      return hashHex
    },
    startMining () {
      if (!this.canMine) {
        return
      }

      this.$axios.$get('/api/blockchain/mine/' + this.selectedAddr, { progress: false }).then(
        async (res) => {
          this.currentBlock = res
          let hashes = 0
          const start = Date.now()
          let interv = start + 500

          const block = this.currentBlock
          let curDifficulty = 0

          do {
            block.timestamp = new Date().getTime()
            block.nonce++
            block.hash = await this.hash(block.index + block.previousHash + block.timestamp + JSON.stringify(block.transactions) + block.nonce)
            curDifficulty = parseInt(block.hash.substring(0, 14), 16)
            hashes++
            if (Date.now() - interv > 200) {
              interv = Date.now()
              this.hashPower = hashes / (Date.now() - start) * 1000
            }
          } while (curDifficulty >= block.difficulty)

          delete block.difficulty

          this.mineErr = undefined
          this.$axios.$post('/api/blockchain/blocks/', { block }).then(
            (res) => {
              console.log(res)
              this.$axios.$get('/api/teller/wallet/transactions/-10', { progress: false }).then((res) => {
                this.$store.commit('setLatestUserTransactions', res.transactions)
              }).catch((err) => {
                console.error((err.response && err.response.data.error) || err)
              })
            }
          ).catch((err) => {
            this.mineErr = 'Error occured, check console.'
            console.error((err.response && err.response.data.error) || err)
          })
        }
      ).catch((err) => {
        console.error((err.response && err.response.data.error) || err)
      })
    }
  }
}
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.block-data {
  margin: 2em 1em;
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
  justify-content: space-between;
}

.btn {
  margin-top: auto;
}

.input-error {
  border-color: var(--clr-red) !important;
}

.label {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.error {
  color: var(--clr-red);
}
</style>
