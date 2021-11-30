export const state = () => ({
  darkMode: localStorage.getItem('darkMode') === 'true',
  transactionCount: 0,
  blockCount: 0,
  coinPrice: 0,
  hashDifficulty: 0,
  latestBlocks: [],
  latestTransactions: []
})

export const mutations = {
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
  }
}
