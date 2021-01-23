ln=`grep -n '<!--dependencies-->' index_template.html | cut -f1 -d:`

random=`dd status=none if=/dev/random bs=16 count=1 | base32`
tempfile="index.html.injecting-$random.tmp"

awk "NR < ${ln}" index_template.html > $tempfile


for dir in libs app
do
    echo "updating dependencies for files in $dir"
    echo -e "\t<!-- deps from $dir -->" >> $tempfile
    while read x
    do
        echo " - $x"
        echo -e "\t$scripts<script src=\"$x\"></script>" >> $tempfile
    done < <(find $dir -iname "*.js")
done

awk "NR > ${ln}" index_template.html >> $tempfile

mv -f $tempfile index.html