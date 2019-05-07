#!/usr/bin/expect

set timeout 90
set name demo-adfssync-1.vmwdemo.int
set user "$env(AD_USERNAME)"
set password "$env(AD_PASSWORD)"

spawn telnet $name

expect "login:" 
send "$user\r" 
expect "password:" 
send "$password\r"
expect ">"
send "C:\\o365scripts\\o365autolicenses.exe.lnk\r"
expect ">"
send "exit\r"