<template>
  <div class="settings">
    <h1>settings</h1>
    <div>
      <div class="inline-button" @click="exportSettings">export settings</div>
      <div class="inline-button" @click="importSettings">import settings</div>
    </div>
    <Section title="recording">
      <Section title="device" :initiallyClosed="false">
        <p> choose the recording device:</p>
        <div class="micgroup" v-for="group, gKey in mics" :key="gKey">
          <p> {{ gKey }}</p>
          <div v-for="micLabel, micId in group" :key="micId" class="button" :class="{selected: micId === state.settings.micDeviceId}" @click="setMic(micId)">
            {{ micId }}: <br/> {{ micLabel }}
          </div>
        </div>
      </Section>
      <Slider
        name="default recording offset in ms"
        left="more delayed"
        right="earlier"
        :factor="1000"
        :decimalPlaces="0"
        :from="sliderOrigin.defaultRecordingOffset - 0.100"
        :to="sliderOrigin.defaultRecordingOffset + 0.100"
        :value="state.settings.defaultRecordingOffset"
        @dragEnd="resetInitialRecordingOffset"
        @update="updateDefaultRecordingOffset"/>
    </Section>
    <div>
      <div class="inline-button" @click="$router.go(-1)">done</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import Slider from '@/components/Slider.vue'
import Section from '@/components/Section.vue'
import { debug } from '@/tools'

export default defineComponent({
  components: {
    Slider,
    Section
  },
  data () {
    return {
      mics: {} as {
        [groupId: string]: {
          [deviceId: string]: string;
        };
      },
      sliderOrigin: {
        defaultRecordingOffset: this.state.settings.defaultRecordingOffset
      }
    }
  },
  mounted () {
    this.requestMediaDevices()
  },
  methods: {
    resetInitialRecordingOffset () {
      this.sliderOrigin.defaultRecordingOffset = this.state.settings.defaultRecordingOffset
      this.storageWrapper.setDefaultRecordingOffset(this.state.settings.defaultRecordingOffset)
    },
    updateDefaultRecordingOffset (v: number) {
      this.state.settings.defaultRecordingOffset = v
    },
    requestMediaDevices () {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const audioInputs = devices.filter(device => (debug(device), device.kind === 'audioinput'))
        audioInputs.forEach(mic => {
          if (!(mic.groupId in this.mics)) {
            this.mics[mic.groupId] = {}
          }
          this.mics[mic.groupId][mic.deviceId] = mic.label
        })
        debug(this.mics)
      })
    },
    setMic (micId: string) {
      debug('selecting', micId)
      this.state.settings.micDeviceId = micId
      this.storageWrapper.setMicDeviceId(micId)
    }
  }
})

</script>

<style lang="scss">
.settings{
  word-wrap: break-word;
  .inline-button{
    @include clickable-surface;
    display: inline-block;
  }
  .button {
    @include clickable-surface;
  }
  .micgroup {
    p, .button {
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .button.selected{
      background-color: $selected;
    }
    p{
      margin: 0em 1em;
    }
  }
}

</style>
