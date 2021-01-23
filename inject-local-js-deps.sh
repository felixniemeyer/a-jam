
till=`grep -n '<!--local deps-->' index.html | cut -f1 -d:`
from=`grep -n '<!--/local deps-->' index.html | cut -f1 -d:`

awk "NR <= ${till}" index.html > index.html.injecting

echo "updating dependencies:"
while read x; do 
    echo $x
    echo -e "\t$scripts<script src=\"$x\"></script>" >> index.html.injecting
done < <(find app -iname "*.js")

awk "NR >= ${from}" index.html >> index.html.injecting

mv -f index.html.injecting index.html