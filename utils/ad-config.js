/**
 * Copyright(c) VmWare
 * All rights reserved.
 * Date: 10/12/18
 */

/* Config file to configure Credentials of DC.
 * Change addict url and repAdmin command according to the DC configured.
 * --url  - DC IP:port no
 * --user - username
 * --pass - password
*/
module.exports = {
    baseUrl: 'http://localhost:3000',
    repUrl: 'http://localhost:8000',
    //addictUrl: 'addict --url ldaps://10.11.25.20:636 --user pocsvcacc2@vmwarepoc.com --pass Passw0rd2', //test
    addictUrl : 'addict --url ldaps://[address]:[port] --user [user]@[domain] --pass [pass],//live
    //repAdmin: 'repadmin /syncall /AdeP [address] dc=[domain],dc=[domain_suffix] /u:[domain]\\[user] /pw:[pass]',
    repAdmin: 'repadmin /syncall /AdeP [address] dc=[domain],dc=[domain_suffix] /u:[domain]\\[user] /pw:[pass]',
    errorMessage:{"error":true,"message":'action cant be performed'}
}
