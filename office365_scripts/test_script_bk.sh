#!/bin/bash

MYDIR="/home/ec2-user/ad-connector/office365_scripts"

DIRS=`ls -l $MYDIR`

# "ls -l $MYDIR"      = get a directory listing
# "| egrep '^d'"           = pipe to egrep and select only the directories
# "awk '{print $8}'" = pipe the result from egrep to awk and print only the 8th field

# and now loop through the directories:
for DIR in $DIRS
do
echo  ${DIR}
done
