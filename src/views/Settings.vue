<template>
  <div class="settings">
    <h1>settings</h1>
    <Section title="recording">
      <Section title="device" :initiallyClosed="false">
        <p>choose the recording device:</p>
        <div
          v-for="micLabel, micId in mics"
          :key="micId"
          class="recdevice"
          :class="{selected: micId === state.settings.micDeviceId}"
          @click="setMic(micId)">
          {{ micLabel || micId }}
        </div>
      </Section>
      <h4> recording offset </h4>
      <Hint title="The recording offset compensates recording latency">
        When the browser starts recording sound, it will take a couple of milliseconds until the recording will actually start. There will be a small time difference, that could be heard when left ignored. Thus, every track allows for a compensation of this lag: the recording offset. Usually the lag depends on the device, operating system and the browser and will be similar each time when recording. Here you can set the default recording offset to the most accurate value. An automatic detection is also available."
      </Hint>
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
      <div class="inline-button" @click="$router.push('OffsetCalibration')">
        automatically calibrate recording offset
      </div>
    </Section>
    <Section title="ipfs" :initiallyClosed="true">
      <Section title="browser node">
        <IpfsInterfaceUsageConfig
          :usage="this.state.settings.ipfs.browserNode.usage"
          @disable="disableBrowserNode"
          @enable="enableBrowserNode"
          @change="persistIpfsSettings"
          id="iiusage0"/>
      </Section>
      <Section title="public node">
        <IpfsInterfaceUsageConfig
          :usage="this.state.settings.ipfs.publicNode.usage"
          @change="persistIpfsSettings"
          id="iiusage1"/>
      </Section>
      <Section title="configurable node">
        <IpfsInterfaceUsageConfig
          :usage="this.state.settings.ipfs.configuredNode.usage"
          @change="persistIpfsSettings"
          id="iiusage2"/>
        <IpfsApiEndpointConfig
          :endpoint="this.state.settings.ipfs.configuredNode.endpoint"
          @change="changeIpfsEndpointConfig"/>
      </Section>
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
import Hint from '@/components/Hint.vue'
import IpfsInterfaceUsageConfig from '@/components/IpfsInterfaceUsageConfig.vue'
import IpfsApiEndpointConfig from '@/components/IpfsApiEndpointConfig.vue'
import { debug } from '@/tools'

import WidthFreezer from '@/mixins/WidthFreezer'

export default defineComponent({
  mixins: [WidthFreezer],
  components: {
    Slider,
    Section,
    Hint,
    IpfsInterfaceUsageConfig,
    IpfsApiEndpointConfig
  },
  data () {
    return {
      mics: {} as {[deviceId: string]: string},
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
        const audioInputs = devices.filter(device => device.kind === 'audioinput')
        audioInputs.forEach(mic => {
          debug('found mic')
          this.mics[mic.deviceId] = mic.label
        })
        debug(this.mics)
      })
    },
    setMic (micId: string) {
      debug('selecting', micId)
      this.state.settings.micDeviceId = micId
      this.storageWrapper.setMicDeviceId(micId)
    },
    persistIpfsSettings () {
      this.storageWrapper.persistIpfsSettings(this.state.settings.ipfs)
    },
    changeIpfsEndpointConfig () {
      this.persistIpfsSettings()
      this.ipfsWrapper.resetConfigurableNode()
    },
    disableBrowserNode () {
      this.ipfsWrapper.shutdownBrowserNode()
    },
    enableBrowserNode () {
      this.ipfsWrapper.spinUpBrowserNode()
    }
  }
})

</script>

<style lang="scss">

body {
  overflow: auto;
}
.settings{
  word-wrap: break-word;
  .recdevice {
    @include clickable-surface;
    text-align: left;
    background-color: darken($turquoise, 30%);
    &.selected {
      background-color: darken($turquoise, 20%);
    }
  }
  .inline-button{
    @include clickable-surface;
    display: inline-block;
  }
}

</style>
