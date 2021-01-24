import { IPFS } from 'ipfs'

export default class IPFSWrapper {
    ipfsNode : IPFS

    constructor(ipfsNode : IPFS){
        this.ipfsNode = ipfsNode
    }
    loadSessionConfig(){
    }
    saveSessionConfig(){
    }
    loadTrackAudio(){
    }
    saveTrackAudio(){
    }
}