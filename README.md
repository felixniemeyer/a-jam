# a-jam

asynchronous jamming

## Remote and asynchronous jam sessions with fellow musicians

This is for musicians who want to exchange and build on their musical ideas with their friends remotely. 
Latency keeps musicians from having real time online jam sessions over the network. A convenient way to record a groove and send it to our friend for him to add vocals and to another one to play solo on top of it, would be a salvation and a motor for musical creation. 

### This app ist built on ipfs
The web app itself is hosted on ipfs:
- If your browser supports ipfs or if you have ipfs companion installed you can open the app with this link:  `ipns://k51qzi5uqu5dgggo67rgyka2qo75vrsylw2idc3j6f570kthbikc8yuzyavflf`
- Otherwise, use a public ipfs gateway like this one: [https://gateway.ipfs.io/ipns/k5...](https://gateway.ipfs.io/ipns/k51qzi5uqu5dgggo67rgyka2qo75vrsylw2idc3j6f570kthbikc8yuzyavflf)

All the data (project files and audio data) is stored on ipfs as well.
Some data such as the project history is stored in browser's localStorage  

<img src="https://github.com/felixniemeyer/jam/raw/webpack/screenshots/home.png" height="450">  <img src="https://github.com/felixniemeyer/jam/raw/webpack/screenshots/session.png" height="450">

Usual workflow
- create a jam session or open one that has been sent by a fellow musician
- rename it
- record audio tracks and rename them
- publish the project and send the sharing link to your fellow musicians

## Build and develop locally using yarn
The web app is written in typescript, uses vue for presentation and webpack to bundle it. 

### Contribute
Please contribute by sending issues & pull requests. 

### install dependencies
```
yarn install
```

### Compiles, serves and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```
