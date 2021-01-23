# inotifywait -q -m -r -e move -e create -e modify -e delete app |
inotifywait -q -m -r -e close_write -e move app libs |
(
deltaMs=200
deltaS=$(bc -l <<< "scale=2 ; $deltaMs/1000")
delta=`expr $deltaMs \* 1000000`
lastUpdate=0
while read -r filename
do
	now=`date +%s%N`
	if [ $now -gt $lastUpdate ]
	then 
		lastUpdate=`expr $now + $delta`
		( sleep "${deltaS}s" ; ./update-js-deps.sh ) &
	fi
done
)
