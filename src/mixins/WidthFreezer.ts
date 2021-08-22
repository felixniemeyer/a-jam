import { defineComponent } from 'vue'
import { debug } from '@/tools'

/** On mobile focussing an input field will bring up the keyboard.
 * Because body min-width is defined as 60vh
 */
export default defineComponent({
  beforeCreate () {
    const width = `${document.body.clientWidth}px`
    document.body.style.setProperty('width', width)
    document.body.style.setProperty('max-width', 'none')
  },
  unmounted () {
    document.body.style.removeProperty('width')
    document.body.style.removeProperty('max-width')
  }
})
