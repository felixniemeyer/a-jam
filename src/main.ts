import { IPFS, create } from 'ipfs'
import App from './app/app'
import IPFSWrapper from './app/ipfs-wrapper'

var ipfsNode:IPFS 

type Params = {[key:string]:boolean|string}

function parseGetParams() : Params {
    var result : Params = {},
        tmp : string[]
    location.search
        .substr(1)
        .split("&")
        .forEach(item => {
            tmp = item.split("=")
            switch(tmp.length) {
                case 1:
                    result[tmp[0]]=true
                    break
                case 2: 
                    result[tmp[0]]=tmp[1]
            }
        })
    return result;
}

const main = (function() {
    document.addEventListener('load', async () => {
    })
    document.addEventListener('DOMContentLoaded', async () => {
        let loader = document.getElementById('loading')
        const loadLog = function(msg:string, type?:string) {
            const logEntry = document.createElement('p')
            logEntry.textContent = msg
            if(type !== undefined) {
                logEntry.className = type
            }
            loader?.appendChild(logEntry)
        }
        const loadError = function (err:string) {
            loadLog(err, 'error')
        }


        loadLog("connecting to ipfs")
        create().then(
            node => {
                let ipfsWrapper = new IPFSWrapper(node)
                let app = new App(ipfsWrapper)
                let params = parseGetParams()
                if(params.sessionCid !== undefined) {
                    if(typeof params.sessionCid == "string") {
                        loadLog("loading session")
                        app.loadSession(params.sessionCid)
                    }
                } else if(params.newSession) {
                    loadLog("creating session")
                    app.createNewSession()
                } else {
                    app.welcome()
                }
                app.mount(document.body)
                loader?.remove()
                /* example usage
                (async function() {
                    const results = await node.add('=^.^= meow meow')
                    console.log(results)
                    const cid = results.cid
                    console.log('CID created via ipfs.add:', cid)
                    const data = await node.cat(cid)
                    console.log(data)
                    const decoder = new TextDecoder
                    const messageParts = []
                    for await (const chunk of data) {
                        console.log(chunk)
                        messageParts.push(decoder.decode(chunk, {stream: true}))
                    }
                    console.log('Data read back via ipfs.cat:', messageParts.join())
                })() */
            }, 
            err => {
                loadError("failed to create IPFS connection:" + err)
            }
        )


    })
})()