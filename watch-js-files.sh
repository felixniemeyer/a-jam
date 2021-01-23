# inotifywait -q -m -r -e move -e create -e modify -e delete app |
inotifywait -q -m -r -e close_write -e move app |
(
deltaMs=200
deltaS=$(bc -l <<< "scale=2 ; $deltaMs/1000")
delta=`expr $deltaMs \* 1000000`
lastUpdate=0
echo "init, puffer duration = ${deltaS}s"
while read -r filename
do
	now=`date +%s%N`
	echo "$now gt $lastUpdate ? "
	if [ $now -gt $lastUpdate ]
	then 
		echo "updating"
		lastUpdate=`expr $now + $delta`
		( sleep "${deltaS}s" ; ./inject-local-js-deps.sh ) &
	fi
done
)
