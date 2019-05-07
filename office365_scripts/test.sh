#!/usr/bin/expect

set timeout 90


expect ">"
send "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -command \"& 'dir' \"\r"
expect ">"
send "exit\r"