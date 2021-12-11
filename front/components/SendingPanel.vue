<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">
        <div>Send BiteCoin</div>
      </div>
    </div>
    <div class="card-body">
      <div class="mb-1">
        <div class="label">
          From
          <div v-if="fromError" class="error">{{ fromError }}</div>
        </div>
        <select class="input" v-model="fromAddr" @change="fromError = undefined" :class="{'input-error': fromError}">
          <option v-for="(addr, i) in addresses" :key="i" :value="addr">
            {{ addr }}
          </option>
        </select>
      </div>
      <div class="mb-1">
        <div class="label">
          To
          <div v-if="toError" class="error">{{ toError }}</div>
        </div>
        <input
          type="text"
          class="input"
          placeholder="Put your receipient's address here"
          v-model="toAddr"
          :class="{'input-error': toError}"
          @change="verifyToAddr"
        >
      </div>
      <div class="mb-1">
        <div class="label">
          Amount
          <div v-if="amountError" class="error">{{ amountError }}</div>
        </div>
        <div class="amount">
          <input
            type="text"
            class="input input-amount"
            placeholder="Put the amount here"
            v-model="amount"
            :class="{'input-error': amountError}"
            @change="verifyAmount"
          >
          <select class="input currency">
            <option>BeTC</option>
            <option>USD</option>
          </select>
        </div>
      </div>
      <div class="mb-1">
        <div class="label">
          Fee
          <div v-if="feeError" class="error">{{ feeError }}</div>
        </div>
        <div class="amount">
          <input
            type="text"
            class="input input-amount"
            placeholder="Put the fee here"
            v-model="fee"
            :class="{'input-error': feeError}"
            @change="verifyFee"
          >
          <select class="input currency">
            <option>BeTC</option>
            <option>USD</option>
          </select>
        </div>
      </div>
      <button class="btn btn-outline w-100" :class="{disabled: !canSend}" @click="createTransaction">Send</button>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      fromAddr: undefined,
      toAddr: undefined,
      amount: undefined,
      fee: 1,

      fromError: undefined,
      toError: undefined,
      amountError: undefined,
      feeError: undefined
    }
  },
  computed: {
    canSend () {
      return this.fromAddr && this.toAddr && this.amount > 0
    },
    addresses () {
      return Object.keys(this.$store.state.addresses)
    }
  },
  methods: {
    createTransaction () {
      let error = false
      if (!this.fromAddr) {
        error = true
        this.fromError = 'choose address'
      }

      if (!this.toAddr) {
        error = true
        this.toError = 'enter a valid address'
      }

      if (!this.amount || !Number(this.amount) || this.amount <= 0) {
        error = true
        this.amountError = 'enter a valid amount'
      }

      if (!this.fee || !Number(this.fee) || this.fee <= 0) {
        error = true
        this.feeError = 'enter a valid fee'
      }

      if (error) {
        return true
      }

      this.fromError = this.toError = this.amountError = this.fromError = undefined

      this.$axios.$post('/api/teller/wallet/transactions', {
        from: this.fromAddr,
        to: this.toAddr,
        amount: this.amount,
        fee: this.fee
      })
    },
    verifyToAddr () {
      if (this.toAddr.length !== 64) {
        this.toError = 'enter a valid address'
      } else {
        this.toError = undefined
      }
    },
    verifyAmount () {
      if (!this.amount || !Number(this.amount) || this.amount <= 0) {
        this.amountError = 'type a valid amount'
      } else {
        this.amountError = undefined
      }
    },
    verifyFee () {
      if (!this.fee || !Number(this.fee) || this.fee <= 0) {
        this.feeError = 'type a valid fee'
      } else {
        this.feeError = undefined
      }
    }
  }
}
</script>

<style scoped>
.amount {
  display: flex;
  flex-direction: row;
}

.input-amount {
  border-radius: 7px 0 0 7px;
}

.input-error {
  border-color: var(--clr-red) !important;
}

.currency {
  width: 6em;
  border-radius: 0 7px 7px 0;
  border-left: none;
}

.btn-send {
  width: 100%;
}

.label {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.error {
  color: rgba(219, 27, 27);
}
</style>
