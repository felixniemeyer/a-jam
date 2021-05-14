import { debug } from '@/tools'
import { defineComponent } from 'vue'

/** On mobile focussing an input field will bring up the keyboard.
 * Because body min-width is defined as 60vh
 */
export default defineComponent({
  mounted () {
    document.addEventListener('keydown', this.handleKeydown)
  },
  unmounted () {
    document.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    handleKeydown () {
      debug('no keyhandler implemented!')
    }
  }
})
