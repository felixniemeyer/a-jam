import { IpfsInterface, SessionConfig } from './ipfs-wrapper'
import axios, { AxiosResponse } from 'axios'

import { debug } from '@/tools'

export class PinataApiSettings {
  constructor(
    public apiKey: string,
    public secret: string,
    public apiBaseUrl: string,
    public gatewayUrl: string
  ) {}
}

export class PinataApiIpfsInterface implements IpfsInterface {

  constructor(
    public apiSettings: PinataApiSettings
  ) {
    this.testAuthentication()
  }

  pin(cid: string): void {
    const url = `${this.apiSettings.apiBaseUrl}/pinning/pinByHash`
    const body = {
      hashToPin: cid,
      hostNodes: {
      }
    }

    axios.post(url, body, {
      headers: {
        pinata_api_key: this.apiSettings.apiKey,
        pinata_secret_api_key: this.apiSettings.secret
      }
    })
  }

  async loadSessionConfig(cid: string): Promise<SessionConfig> {
    const response = await axios
      .get(
        this.apiSettings.gatewayUrl + '/ipfs/' + cid,
        {
          responseType: "json"
        }
      )
    return response.data as SessionConfig
  }

  async loadRecording(cid: string): Promise<ArrayBuffer> {
    const response = await axios
      .get(
        this.apiSettings.gatewayUrl + '/ipfs/' + cid,
        {
          responseType: "arraybuffer"
        }
      )
    return response.data
  }

  async add(content: Blob | string) {
    if(content instanceof Blob) {
      return this.addBlob(content as Blob)
    } else if (typeof(content) == 'string') {
      return this.addJsObject(JSON.parse(content as string))
    } else {
      throw Error("content type not supported for adding to pinata")
    }
  }

  async addBlob(content: Blob): Promise<string> {
    const url = `${this.apiSettings.apiBaseUrl}/pinning/pinFileToIPFS`;
    let data = new FormData()
    data.append('file', content)

    data.append('pinataOptions', JSON.stringify({
      cidVersion: 1
    }))

    let response = await axios.post(url, data, {
      headers: {
        'Content-Type': `multipart/form-data`,
        pinata_api_key: this.apiSettings.apiKey,
        pinata_secret_api_key: this.apiSettings.secret
      }
    })

    return response.data.IpfsHash
  }

  async addJsObject(content: Object): Promise<string> {
    const url = `${this.apiSettings.apiBaseUrl}/pinning/pinJSONToIPFS`;

    const body = ({
      pinataOptions: {
        cidVersion: 1
      },
      pinataMetadata: {
        name: "a-jam session config"
      },
      pinataContent: content
    })

    let response = await axios.post(url, body, {
      headers: {
        pinata_api_key: this.apiSettings.apiKey,
        pinata_secret_api_key: this.apiSettings.secret
      }
    })

    return response.data.IpfsHash
  }

  async testAuthentication() : Promise<AxiosResponse> {
    const url = `${this.apiSettings.apiBaseUrl}/data/testAuthentication`
    const response = await axios.get(url, {
        headers: {
          pinata_api_key: this.apiSettings.apiKey,
          pinata_secret_api_key: this.apiSettings.secret
        }
      })
    debug("testing pinata auth", response)
    return response
  }
}

