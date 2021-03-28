import { defineComponent } from 'vue'

/** On mobile focussing an input field will bring up the keyboard.
 * Because body min-width is defined as 60vh
 */
export default defineComponent({
  beforeCreate () {
    document.body.style.setProperty('width', `${document.body.clientWidth}px`)
  },
  unmounted() {
    document.body.style.removeProperty('width')
  },
})
