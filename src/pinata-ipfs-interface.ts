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
    debug("loading session config from pinata gateway")
    const response = await axios
      .get(
        this.apiSettings.gatewayUrl + '/ipfs/' + cid,
        {
          responseType: "json"
        }
      )
    debug("loaded", response)
    return response.data as SessionConfig
  }

  async loadRecording(cid: string): Promise<ArrayBuffer> {
    debug("loading recording from pinata gateway")
    const response = await axios
      .get(
        this.apiSettings.gatewayUrl + '/ipfs/' + cid,
        {
          responseType: "arraybuffer"
        }
      )
    debug("loaded", response)
    return response.data
  }

  async add(content: Blob | string) : Promise<string> {
    if(content instanceof Blob) {
      return this.addBlob(content as Blob)
    } else if (typeof(content) == 'string') {
      return this.addJSON(content as string)
    } else {
      throw Error("content type not supported for adding to pinata")
    }
  }

  async addBlob(content: Blob): Promise<string> {
    const url = `${this.apiSettings.apiBaseUrl}/pinning/pinFileToIPFS`;
    const data = new FormData()
    data.append('file', content)

    data.append('pinataOptions', JSON.stringify({
      cidVersion: 1
    }))

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': `multipart/form-data`,
        pinata_api_key: this.apiSettings.apiKey,
        pinata_secret_api_key: this.apiSettings.secret
      }
    })

    return response.data.IpfsHash
  }

  async addJSON(content: string): Promise<string> {
    const obj = JSON.parse(content as string)
    const url = `${this.apiSettings.apiBaseUrl}/pinning/pinJSONToIPFS`;

    const body = ({
      pinataOptions: {
        cidVersion: 1
      },
      pinataMetadata: {
        name: "a-jam session config"
      },
      pinataContent: obj
    })

    const response = await axios.post(url, body, {
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

