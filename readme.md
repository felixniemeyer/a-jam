# Jam
Record tracks, share with others, let them add tracks = jam asynchronously. 
Web app will be hosted on IPFS. 
Projects and audio will be stored on IPFS as well. 

Motivation: 
- have a way for remotely making music with my mates. 
- promote decentral technologies. 
## Developping
### Build
Run `npm run sass` to build `style.css` from `style.scss`
### About js packages
We don't use Webpack or anything to package the code into one file, because we want to leverage, that many programs use the same js packages


#
Looking for a way to bundle my js project for the browser but leave package js files intact and load them from the index.html via <script> tags.

Hey,
I'm building a web app that'll be hosted on IPFS. 
On IPFS every file has a contend identifier that is basically a hash of the file. If many people upload files that are identical, they all have the same cid. If many webapps hosted on IPFS refer to the packages they use instead of bundling them, storage will be saved - it's a bit like dynamic linked libs and static libs. 
Therefore I don't bundle js packages like js-ipfs or vue. 

.... just clicked save accidentally (ctrl-enter) ... i'm editing this post right now - ti is not finished yet ;D