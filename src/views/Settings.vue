<template>
  <div class="settings">
    <h1>settings</h1>
    <!--div>
      <div class="inline-button" @click="exportSettings">export settings</div>
      <div class="inline-button" @click="importSettings">import settings</div>
    </div-->
    <Section title="ipfs">
      <Ipfsv-for="(ipfsIf, iName) of this.state.settings.ipfs" :key="iName" :title="iName" class="tll">
        <IpfsInterfaceUsage :interfaceUsage="this.state.settings.ipfs.browserNode.enabled"/>
        <IpfsInterfaceUsage :interfaceUsage="this.state.settings.ipfs.configuredNode.enabled"/>
        <IpfsInterfaceUsage :interfaceUsage="this.state.settings.ipfs.browserNode.enabled"/>
        <div>
        <input type="checkbox" :id="`enable${iName}`" v-model="ipfsIf.usage.enabled" @change="persistIpfsSettings"/>
        <label :for="`enable${iName}`">Enable this ipfs interface.</label>
        </div>
        <div>
        <input type="number" :id="`retrievalPrio${iName}`" v-model="ipfsIf.usage.useForRetrievalPriority" @change="persistIpfsSettings"/>
        <label :for="`retrievalPrio${iName}`">Set this interface's priority for content retrieval from ipfs. The interface with the highest priority will be used for content retrieval.</label>
        </div>
        <div>
        <input type="checkbox" :id="`pinning${iName}`" v-model="ipfsIf.usage.useForPinning" @change="notifyIpfsSettingsChange"/>
        <label :for="`pinning${iName}`">Use this ipfs interface for pinning.</label>
        </div>
        <div>
        <input type="checkbox" :id="`pinForeign${iName}`" v-model="ipfsIf.usage.pinForeignSessions" @change="persistIpfsSettings"/>
        <label :for="`pinForeign${iName}`">Pin sessions when loading jam sessions in order to improve availability.</label>
        </div>
        <div v-if="ipfsIf == state.settings.ipfs.configuredNode">
          <div>
            node api host:
            <input v-model="ipfsIf.endpoint.host" @change="persistIpfsSettings">
          </div>
          <div>
            node api port:
            <input type="number" v-model="ipfsIf.endpoint.port" @change="persistIpfsSettings">
          </div>
          <div>
            node api protocol: {{ ipfsIf.endpoint.protocol }}
          </div>
          <p>The target ipfs node needs to be configured to allow CORS. Set HTTPHeaders like for example API.HTTPHeaders.Access-Control-Allow-Origin: ["k51qzi5uqu5dgggo67rgyka2qo75vrsylw2idc3j6f570kthbikc8yuzyavflf.ipns.localhost"].
        </p>
        </div>
      </Section>
    </Section>
    <Section title="recording">
      <Section title="device" :initiallyClosed="false">
        <p> choose the recording device:</p>
        <div class="micgroup" v-for="group, gKey in mics" :key="gKey">
          <p> {{ gKey }}</p>
          <div v-for="micLabel, micId in group" :key="micId" class="button" :class="{selected: micId === state.settings.micDeviceId}" @click="setMic(micId)">
            {{ micLabel || micId }}
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
        const audioInputs = devices.filter(device => device.kind === 'audioinput')
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
    },
    persistIpfsSettings () {
      this.storageWrapper.persistIpfsSettings(this.state.settings.ipfs)

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
  .tll {
    text-align: left;
  }
}

</style>
