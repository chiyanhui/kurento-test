var kurento = require('kurento-client');
var client = null, task = null;

kurento.getKurentoClient = async function() {
    if (client) {
        return client;
    }
    if (!task) {
        task = new Promise((resolve, reject) => {
            kurento('ws://192.168.56.103:8888/kurento', function(error, kurentoClient) {
                if (error) {
                    reject(error);
                } else {
                    client = kurentoClient;
                    resolve(kurentoClient);
                }
            });
        });
    }
    return task;
};

module.exports = kurento;
