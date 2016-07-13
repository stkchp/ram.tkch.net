#!/bin/bash

cd $(dirname $0)
CURDIR=$(pwd)
TIMESTAMP=$CURDIR/.timestamp

# compress(for gzip_static)
find ./htdocs -cnewer $TIMESTAMP -type f | grep -v ".gz$" | xargs -r zopfli

# renew timestamp
touch $CURDIR/.timestamp


# check gz <=> normal file, if normal is small, delete it.
check_size() {
	while read line
	do
		[[ ! -f ${line}.gz ]] && continue

		BASE=$( wc -c ${line}    | cut -d' ' -f1 )
		COMP=$( wc -c ${line}.gz | cut -d' ' -f1 )
		RATE=$( echo "$COMP * 100 / $BASE" | bc )

		# 90%-100%, delete gz file.
		[[ $RATE -gt 90 ]] && rm -vf ${line}.gz
	done
}
find ./htdocs -type f | grep -v ".gz$" | check_size



# data upload
# remote server don't have rsync, use scp instead.
# scp -rp $CURDIR/htdocs/* ram.tkch.net:/var/www/ram.tkch.net/htdocs/
# remote server have rsync, use checksum comparison.
rsync -rlpcgoDv --delete $CURDIR/htdocs/ ram.tkch.net:/var/www/ram.tkch.net/htdocs/
