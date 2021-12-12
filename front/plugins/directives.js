import Vue from 'vue'

function tooltipEnter (value, ev) {
  const ttip = document.createElement('div')
  ttip.id = 'tooltip'
  ttip.className = 'tooltip'
  ttip.style.left = `${ev.x}px`
  ttip.style.top = `${this.getBoundingClientRect().y - 10}px`

  if (typeof value === 'function') {
    ttip.textContent = value(this)
  } else if (typeof value === 'object') { // add interval support
    ttip.textContent = JSON.stringify(value)
  } else {
    ttip.textContent = value
  }

  const oldTtip = this.querySelector('#tooltip')
  if (oldTtip) {
    this.removeChild(oldTtip)
  }

  this.__tooltipElement = ttip
  this.appendChild(ttip)
}

function tooltipLeave () {
  this.removeChild(this.__tooltipElement)
}

Vue.directive('tooltip', {
  bind: (el, binding) => {
    console.log(el, binding)
    el.__tooltipEvents = {
      enter: tooltipEnter.bind(el, binding.value),
      leave: tooltipLeave.bind(el)
    }

    el.addEventListener('mouseenter', el.__tooltipEvents.enter)
    el.addEventListener('mouseleave', el.__tooltipEvents.leave)
  },

  unbind: (el) => {
    el.removeEventListener('mouseenter', el.__tooltipEvents.enter)
    el.removeEventListener('mouseleave', el.__tooltipEvents.leave)
  }
})
