const https = require('https')
const fs = require('fs')
const express = require('express')

const app = express()
app.use(express.static('dist'))

const options = {
  key: fs.readFileSync('/home/fairlix/192.168.1.68-key.pem'),
  cert: fs.readFileSync('/home/fairlix/192.168.1.68.pem')
}

https
  .createServer(options, app)
  .listen(8440)
