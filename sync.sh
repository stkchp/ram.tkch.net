#!/bin/bash

cd $(dirname $0)
CURDIR=$(pwd)


# compress(for gzip_static)
find ./htdocs -type f | grep -v ".gz$" | xargs gzip --best -k -f 



check_size() {
	while read line
	do
		BASE=`wc -c ${line}    | cut -d' ' -f1`
		COMP=`wc -c ${line}.gz | cut -d' ' -f1`

		[[ $BASE -lt $COMP ]] && rm -vf ${line}.gz
	done
}

find ./htdocs -type f | grep -v ".gz$" | check_size





# data upload
# remote server don't have rsync, use scp instead.
scp -rp $CURDIR/htdocs/* ram.tkch.net:/var/www/ram.tkch.net/htdocs/
