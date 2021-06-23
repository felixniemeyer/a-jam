yarn build
ipfs add -r --cid-version 1 dist/

echo "you might also want to:"
echo " - pin the cid on pinata" 
echo " - update ipns" 
echo " - manually update unstoppable domains" 

