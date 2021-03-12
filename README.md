# a-jam

asynchronous jamming

## Remote and asynchronous jam sessions with fellow musicians

This is for musicians who want to exchange and build on their musical ideas with their friends remotely. 
Latency keeps musicians from having real time online jam sessions over the network. This web app lets you record a track and send it to your fellow for him to asynchronously add vocals or play solo on top of it. 

This web app lets you 
- create jam sessions or open one that has been sent by a fellow musician
- playback all recorded tracks together 
- record new audio tracks 
- publish the project and send the sharing link to your fellow musicians

<img src="https://raw.githubusercontent.com/felixniemeyer/a-jam/main/screenshots/home.png" height="450">  <img src="https://raw.githubusercontent.com/felixniemeyer/a-jam/main/screenshots/session.png" height="450">

### This app ist built on ipfs
The web app itself is served from ipfs:

- If your browser supports ipfs or if you have ipfs companion installed you can open the app with this link:  `ipns://k51qzi5uqu5dgggo67rgyka2qo75vrsylw2idc3j6f570kthbikc8yuzyavflf`
- Otherwise, use a public ipfs gateway like this one: [https://gateway.ipfs.io/ipns/k5...](https://gateway.ipfs.io/ipns/k51qzi5uqu5dgggo67rgyka2qo75vrsylw2idc3j6f570kthbikc8yuzyavflf)

All the data (project files and audio data) is stored on ipfs as well.
Some data such as the project history is stored in browser's localStorage  

Ipfs a new decentral protocol and a substitution for https and traditional client-server architectures. If you want to know more, the [official ipfs website](https://ipfs.io) is a good starting point. 

## Build and develop locally using yarn
The web app is written in typescript, uses vue for presentation and webpack for bundling. 

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
