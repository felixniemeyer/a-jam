<template>
  <router-view></router-view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
})
</script>

<style lang="scss">
/* {
  outline: 1px solid pink;
} /**/

body {
  position: absolute;
  width: 100%;
  height: 100%;
  margin: 0;
  max-width: 60vh;
  left: 50%;
  transform: translate(-50%, 0);
  overflow-x: hidden;
  background-color: #544;
  color: #e9e9e9;

  font-family: sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #e2e5eb;
}

a {
  color: $pink;
  &:visited {
    color: desaturate($pink, 80%);
  }
}

h1 {
  margin-top: 1rem;
}

input {
  padding: 1rem;
  margin: 0.5rem;
  background-color: darken($turquoise, 30%);
  &:disabled {
    background-color: desaturate(darken($turquoise, 20%), 70%);
  }
  border: 0.1rem solid #222;
  border-radius: 0.5rem;
  color: #ddd;
  font-weight: bold;
  &:focus {
    outline: none;
  }
}

.cornerbutton {
  @include centered-background-image;
  position:fixed;
  z-index: 10;
  background-color: darken($turquoise, 20%);
  height: 3rem;
  width: 3rem;
  background-size: 50%;
  cursor: pointer;
  border-radius: 0.5rem;
  &:hover {
    background-color: darken($turquoise, 5%);
  }
}

.cornerbutton.back {
  left: 1rem;
  top: 1rem;
  background-image: url('~@/assets/icons/white/back.svg');
}

.code {
  font-family: monospace;
}
</style>
