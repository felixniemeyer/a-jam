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

The web app is written in typescript, uses vue for presentation and webpack for bundling. 

### Opting out of ipfs
I once explored the feasability of building an app without any servers purely on ipfs. 
I learned that IPFS is not suitable for that at the moment. Maybe it will be, when it is normal that people run ipfs nodes on their devices or use personal gateways. Until then, IPFS is still useful but requires the maintanance of servers and gateways by the developer. Because I want non-tech-savy people to use this app and because I don't want to maintain a ipfs gateway that could be abused because it would necessarily be public, I am switching to an easy central hosting approach for now. 

## Recommended dev setup of server and ui
Run `yarn watch` in this repo. 
Create a symlink from (the a-jam server repo)[https://github.com/felixniemeyer/a-jam-server] directory to this repo's `./dist`
Run `yarn start` in the server repo. 


### Contribute
Please contribute by sending issues & pull requests. 

