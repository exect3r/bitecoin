export const state = () => ({
  darkMode: localStorage.getItem('darkMode') === 'true',
  transactionCount: 0,
  blockCount: 0
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
  }
}
