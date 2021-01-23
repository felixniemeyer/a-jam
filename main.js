ipfsNode = undefined

function parseGetParams() {
    var result = {},
        tmp = []
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
    let ui 
    document.addEventListener('load', async () => {
    })
    document.addEventListener('DOMContentLoaded', async () => {
        let loader = document.getElementById('loading')
        const loadLog = function(msg, type) {
            const logEntry = document.createElement('p')
            logEntry.textContent = msg
            if(type !== undefined) {
                logEntry.className = type
            }
            loader.appendChild(logEntry)
        }
        const loadError = function (err) {
            loadLog(msg, 'error')
        }
        loadLog("creating ui")
        ui = new Ui({})

        loadLog("creating IPFS node")
        Ipfs.create().then(
            node => {
                nodeWrapper = new IPFSWrapper(node)
                params = parseGetParams()
                if(params.sessionCid !== undefined) {
                    loadLog("loading session")
                    ui.loadSession(params.sessionCid)
                } else if(params.newSession) {
                    loadLog("creating session")
                    ui.createNewSession()
                } else {
                    ui.welcome()
                }
                ui.mount(document.body)
                loader.remove()
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
                loadError("failed to create IPFS connection:", err)
            }
        )


    })
    return this
})()