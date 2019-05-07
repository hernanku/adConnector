const config         = require("../config/config.js").getEnvironmentKey();
const errorGenerator = require('./../utils/errorGenerator');

const AUTH_ERR = 'auth_error';

module.exports = (req,res,next) => {
    let response;
    let api_key = req.headers['api-key'] || req.headers['API-KEY'];

    if(api_key) {
        if(api_key === config.api_key) {
            next();
        }else {
            let errType = {type:AUTH_ERR, key:'invalid_api_key'};
            response    = errorGenerator.generateErrorCode(errType);
            return res.status(response.code).json(response);
        }
    }else {
        let errType = {type:AUTH_ERR, key:'missing_api_key'};
        response    = errorGenerator.generateErrorCode(errType);
        return res.status(response.code).json(response);
    }
};