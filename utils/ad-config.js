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
    addictUrl : 'addict --url ldaps://ad-dev-adc1.dev-adc.int:636 --user devadmin@dev-adc.int  --pass Welcome@DC1!',//live
    //repAdmin: 'repadmin /syncall /AdeP TRVUSTCVDW0525.vmwarepoc.com dc=vmwarepoc,dc=com /u:vmwarepoc.com\\pocsvcacc2 /pw:Passw0rd2',
    repAdmin: 'repadmin /syncall /AdeP ad-dev-adc1.dev-adc.int dc=dev-adc,dc=int /u:dev-adc\\devadmin /pw:Welcome@DC1!',
    errorMessage:{"error":true,"message":'action cant be performed'}
}