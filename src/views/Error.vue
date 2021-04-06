<template>
  <div class='errorPage'>
    <h1>Error</h1>
    <p v-for="(msg, key) in msgs" :key="key">
      {{msg}}
    </p>
    <div class="button" @click="$router.replace('/')">done</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  computed: {
    msgs (): string[] {
      const type = this.$route.params.type as string
      switch (type) {
        case 'noSuchLocalSession':
          return [
            'The url contained a local session id for which no local session was in memory.',
            'Local sessions get swiped when you reload the app.',
            'Make sure to publish changes, that you want persited.'
          ]
        default:
          return ['Unknown Error:', type]
      }
    }
  }
})
</script>

<style lang="scss">
.errorPage{
  p {
    color: $warn;
  }
  .button {
    @include clickable-surface;
    display: inline-block;
  }
}

</style>
