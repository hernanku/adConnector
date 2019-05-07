var request = require("request");

var getUser = function () {
    Request.get("http://localhost:8080/user",  (error, response, body) =>  {
            if (error) {
                    return  console.dir(error);
            }
            console.dir(JSON.parse(body));
    })
}

var postUser = function () {
    var options = {
        url: "http://localhost:8080/user",
        headers: {
          'content-type': 'application/json'
        },
        body: {"commonName":"vmwarePoc","userName":"vmwarePocUser","Password":"Vmware9!"},
        json: true
      };
    Request.get(options,  (error, response, body) =>  {
            if (error) {
                    return  console.dir(error);
            }
            console.dir(JSON.parse(body));
    })
}