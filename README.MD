# activeDirectoryConnector
nodeJS app to connect and make changes to Windows Active directory


Installation
Software Needed
Node 10.15.1 https://nodejs.org/en/download/



How to install the Ad-connector Application

Install Addict framework
               npm i addict -g
Clone the ad-connector repo
Install all the dependencies
               npm install (will fetch all the dependencies specified in package.json).

How to start the Application     
Open the cmd Window , go to the root folder and type the following.
     npm run startAddict

Launch addict framework/Microservice from the cmd window
      addict --url ldaps://[address] --user [user]@[domain] --pass [pass]
       note- configure parameters according to the DC.

In browser go to http://localhost:8080/api-docs. It will list all the available end points.
API end points can be test from the browser itself.

Note1: when application is Installed for the first time, the default cache is set to 10 minutes.
You can change the default caching by going to ~\node_modules\ad\index.js (The folder where node installed).
Edit the cache parameters in the index.js
