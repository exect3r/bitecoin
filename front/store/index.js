export const state = () => ({
  bundles: {},
  activeBundles: {},
  darkMode: localStorage.getItem('darkMode') === 'true',
  transactionCount: 0,
  blockCount: 0,
  coinPrice: 0,
  hashDifficulty: 0,
  latestBlocks: [],
  latestTransactions: [],
  balance: 0,
  addresses: {},
  latestUserTransactions: []
})

export const mutations = {
  // Dark mode
  enableDarkMode (state) {
    state.darkMode = true
    localStorage.setItem('darkMode', state.darkMode)
  },

  disableDarkMode (state) {
    state.darkMode = false
    localStorage.setItem('darkMode', state.darkMode)
  },

  toggleDarkMode (state) {
    state.darkMode = !state.darkMode
    localStorage.setItem('darkMode', state.darkMode)
  },

  // General details
  setTransactionCount (state, count) {
    state.transactionCount = count
  },

  setBlockCount (state, count) {
    state.blockCount = count
  },

  setCoinPrice (state, price) {
    state.coinPrice = price
  },

  setHashDifficulty (state, diff) {
    state.hashDifficulty = diff
  },

  setLatestBlocks (state, blocks) {
    state.latestBlocks = blocks
  },

  setLatestTransactions (state, transactions) {
    state.latestTransactions = transactions
  },

  // Bundles
  activateBundle (state, bundleName) {
    if (!state.bundles[bundleName]) {
      console.warn('Bundle ' + bundleName + ' does not exist')
      return
    }

    if (!state.bundles[bundleName].f) {
      console.warn('Bundle ' + bundleName + ' does not have an update function')
      return
    }

    if (!state.bundles[bundleName].freq) {
      console.warn('Bundle ' + bundleName + ' does not have an update frequency')
      return
    }

    state.activeBundles[bundleName] = true
    state.bundles[bundleName].intervalId = setInterval(state.bundles[bundleName].f, state.bundles[bundleName].freq)
    this.commit('maximizeElapsedTimes', bundleName)
    state.bundles[bundleName].f()
  },

  disactivateBundle (state, bundleName) {
    if (!state.bundles[bundleName]) {
      console.warn('Bundle ' + bundleName + ' does not exist')
      return
    }

    state.activeBundles[bundleName] = false

    if (state.bundles[bundleName].intervalId) {
      clearInterval(state.bundles[bundleName].intervalId)
    }
  },

  setBundleUpdateInfo (state, { bundleName, freq }) {
    if (state.bundles[bundleName].intervalId) {
      clearInterval(state.bundles[bundleName].intervalId)
    }

    state.bundles[bundleName].f = () => {
      Object.keys(state.activeBundles).forEach((bundleName) => {
        if (!state.activeBundles[bundleName]) {
          return
        }

        (state.bundles[bundleName] || []).forEach((item, i) => {
          this.commit('increaseElapsedTime', { bundleName, itemIndex: i })
          if (item.elpasedTime >= item.cycle) {
            this.commit('resetElapsedTime', { bundleName, itemIndex: i })
            if (typeof item.func === 'function') {
              item.func()
            }

            if (item.once) {
              item.func = 'done'
              delete item.once
            }
          }
        })
      })
    }

    state.bundles[bundleName].freq = freq
  },

  setBundle (state, { bundleName, list, freq }) {
    state.bundles[bundleName] = list.map(l =>
      typeof l === 'function'
        ? {
            func: l,
            once: false,
            cycle: 1,
            elpasedTime: Number.MAX_VALUE
          }
        : {
            func: l.func,
            once: l.once || false,
            cycle: l.cycle || 1,
            elpasedTime: Number.MAX_VALUE
          })
    this.commit('setBundleUpdateInfo', { bundleName, freq })
  },

  maximizeElapsedTimes (state, bundleName) {
    state.bundles[bundleName].forEach((item) => {
      item.elpasedTime = Number.MAX_VALUE
    })
  },

  increaseElapsedTime (state, { bundleName, itemIndex }) {
    state.bundles[bundleName][itemIndex].elpasedTime++
  },

  resetElapsedTime (state, { bundleName, itemIndex }) {
    state.bundles[bundleName][itemIndex].elpasedTime = 0
  },

  // User data
  setBalance (state, balance) {
    state.balance = balance
  },

  setAddresses (state, addresses) {
    state.addresses = addresses
  },

  setBalanceForAddress (state, { address, balance }) {
    state.addresses[address] = balance
  },

  setLatestUserTransactions (state, transactions) {
    state.latestUserTransactions = transactions
  }
}

export const actions = {
  init (ctx) {
    ctx.commit('setBundle', {
      bundleName: 'wallet',
      list: [
        {
          func: function () {
            this.$axios.$get('/api/teller/wallet/addresses', { progress: false }).then(
              (res) => {
                const addrs = {}
                res.addresses.forEach((addr) => { addrs[addr] = this.state.addresses[addr] || 0 })
                this.commit('setAddresses', addrs)

                Object.keys(this.state.addresses).forEach((addr) => {
                  this.$axios.get('/api/teller/' + addr + '/balance', { progress: false }).then((res) => {
                    this.commit('setBalanceForAddress', { address: addr, balance: res.data.balance })
                  }).catch((err) => {
                    console.log(err.response || err)
                  })
                })
              }
            ).catch((err) => {
              console.log(err.response || err)
            })
          }.bind(this)
        },
        function () {
          this.$axios.get('/api/teller/wallet/balance', { progress: false }).then((res) => {
            this.commit('setBalance', res.data.balance)
          }).catch((err) => {
            console.log(err.response || err)
          })
        }.bind(this),
        {
          func: function () {
            this.$axios.$get('/api/teller/wallet/transactions/-10', { progress: false }).then((res) => {
              this.commit('setLatestUserTransactions', res.transactions)
            }).catch((err) => {
              console.log(err.response || err)
            })
          }.bind(this),
          cycle: 10
        }
      ],
      freq: 500
    })

    ctx.commit('setBundle', {
      bundleName: 'explorer',
      list: [
        async function () {
          const info = await this.$axios.$get('/api/blockchain/info', { progress: false })
          this.commit('setBlockCount', info.blockCount)
          this.commit('setTransactionCount', info.transactionCount)
          this.commit('setHashDifficulty', info.hashPower)

          const blocks = await this.$axios.$get('/api/blockchain/blocks/-10', { progress: false })
          this.commit('setLatestBlocks', blocks)
          const transactions = await this.$axios.$get('/api/blockchain/transactions/-10', { progress: false })
          this.commit('setLatestTransactions', transactions)
        }.bind(this)
      ],
      freq: 1000
    })
  },

  resetUserData (ctx) {
    ctx.commit('setBalance', 0)
    ctx.commit('setLatestUserTransactions', [])
    ctx.commit('setAddresses', [])
  }
}
