import { IpfsInterface, SessionConfig } from './ipfs-wrapper'
import axios from 'axios'
import pinataSdk, { PinataClient } from '@pinata/sdk'

export class PinataApiSettings {
  constructor(
    public apiKey: string,
    public secret: string,
    public gatewayUrl: string
  ) {}
}

export class PinataApiIpfsInterface implements IpfsInterface {
  private pinata: PinataClient;

  constructor(
    public apiSettings: PinataApiSettings
  ) {
    this.pinata = pinataSdk(apiSettings.apiKey, apiSettings.secret)
  }

  pin(cid: string): void {
      this.pinata.pinByHash(cid)
  }

  async loadSessionConfig(cid: string): Promise<SessionConfig> {
    let response = await axios
      .get(
        this.apiSettings.gatewayUrl + '/ipfs/' + cid,
        {
          responseType: "json"
        }
      )
    return response.data as SessionConfig
  }

  async loadRecording(cid: string): Promise<ArrayBuffer> {
    let response = await axios
      .get(
        this.apiSettings.gatewayUrl + '/ipfs/' + cid,
        {
          responseType: "arraybuffer"
        }
      )
    return response.data
  }

  async add(blob: string | Blob): Promise<string> {
    let stream = (typeof blob) === 'string' ?
      blob as string :
      (blob as Blob).stream()

    let result = await this.pinata.pinFileToIPFS(
      stream,
      {
        pinataMetadata: {
          name: 'pin from a-jam',
        },
        pinataOptions: {
          cidVersion: 1
        }
      }
    )
    return result.IpfsHash
  }

  async testAuthentication(settings: PinataApiSettings) {
    const url = 'https://api.pinata.cloud/data/testAuthentication'
    let response = await axios.get(url, {
        headers: {
          pinata_api_key: settings.apiKey,
          pinata_secret_api_key: settings.secret
        }
      })
    return response
  }
}

