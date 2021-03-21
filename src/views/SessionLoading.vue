<template>
  <div class="loading">
    <h1> loading... </h1>
    <Log
      :entries="loadingLog"/>
    <p v-if="loadingErrors.length > null" class="error">Errors occured while loading session: {{ loadingErrors.join(', ') }}</p>
    <div class="button" @click="$emit('goHome')">
      {{ loadingError === null ? 'abort' : 'ok' }}
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

import { useStore } from '@/store'

const store = useStore() // TODO: check: does having this const cause problems?

export default defineComponent({
  computed:{
    loadingLog() {
      return store.state.loading.log
    },
    loadingErrors() {
      return store.state.loading.errors;
    }
  }
})
</script>

<style lang="sass">

</style>
