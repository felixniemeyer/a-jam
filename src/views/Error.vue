<template>
  <div class='errorPage'>
    <h1>Error</h1>
    <p v-for="(msg, key) in msgs" :key="key">
      {{msg}}
    </p>
    <div class="button" @click="$router.replace('/')">ok</div>
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
            'The route contained a local session id for which no local session was in memory:',
            this.$route.query.localId as string,
            'Local sessions get swiped when you reload the app.',
            'Make sure to publish changes, that you want persited.'
          ]
        case 'unknownPath':
          return [
            'The path', 
            this.$route.query.path as string, 
            'could not be matched.'
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
    color: $danger;
  }
  .button {
    @include clickable-surface;
    display: inline-block;
  }
}

</style>
