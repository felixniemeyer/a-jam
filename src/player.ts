import { ref, Ref } from "vue";

export interface PlayerState {
  playing: Ref<boolean>
}

export class Player {
  state: PlayerState = {
    playing: ref(false)
  }
    
  stopAllSources() {
    
  }
}