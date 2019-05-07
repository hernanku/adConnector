#!/usr/bin/expect

set timeout 90
set name ad-dev-adc1.dev-adc.int
set user "$env(AD_USERNAME)"
set password "$env(AD_PASSWORD)"


set user_name [lindex $argv 0]

spawn telnet $name 80

expect "login:" 
send "$user\r" 
expect "password:" 
send "$password\r"
expect ">"
send "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -command \"& 'C:\\o365scripts\\AssignLicense.ps1' $user_name\"\r"
expect ">"
send "exit\r"
