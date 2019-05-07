try {
    require('dotenv').config();
}catch (e) {
    console.log('The file .env is not found in root directory.');
}

module.exports.getEnvironmentKey = () => {
    let data = {
        "api_key"   : process.env.API_KEY,
        "node_env"  : process.env.NODE_ENV
    }
    return data;
};