<template>
  <div class="track-settings">
    <input :value="track.name" ref="name" @keyup="submitOnEnter">
    <div>
      <div class="inline-button" @click="cancel">cancel</div>
      <div class="inline-button" @click="save">ok</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Track from '@/datamodel/Track'

@Options({
  components: {},
  emits: ['cancel', 'save']
})
export default class TrackSettings extends Vue {
  @Prop(Track) track!: Track
  cancel() {
    this.$emit('cancel')
  }

  mounted() {
    (this.$refs.name as HTMLInputElement).select()
  }

  submitOnEnter($event: KeyboardEvent) {
    if ($event.key === 'Enter') {
      this.save($event)
    }
  }

  save($event: Event) {
    console.log('emitting')
    this.$emit('save', $event, {
      name: (this.$refs.name as HTMLInputElement).value

    })
  }
}
</script>

<style lang="scss">
.track-settings {
  position: absolute;
  width: 100%;
  top: 50%;
  transform: translate(0, -50%);
  .inline-button{
    @include clickable-surface;
    display: inline-block;
  }
  input {
    padding: 1em;
  }
}
</style>
