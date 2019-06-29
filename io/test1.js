const kurento = require('../util/kurento');
let client;
(async function() {
    client = await kurento.getKurentoClient();
})();

module.exports = socket => {
    socket.on('message', function(type, data) {
        switch(type) {
            case 'offer': {
                socket.candidates = [];
                start(socket, data.sdp);
                break;
            }
            case 'candidate': {
                addCandidate(socket, data);
                break;
            }
        }
    });
    socket.on('disconnecting', function() {
        if (socket.pipeline) {
            socket.pipeline.release();
        }
    });
}

async function start(socket, sdpOffer) {
    const pipeline = await client.create('MediaPipeline');
    socket.pipeline = pipeline;
    const endPoint = await pipeline.create('WebRtcEndpoint');
    socket.endPoint = endPoint;
    while(socket.candidates.length) {
        var candidate = socket.candidates.shift();
        endPoint.addIceCandidate(candidate);
    }
    await endPoint.connect(endPoint);
    endPoint.on('OnIceCandidate', function(event) {
        var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
        socket.send('candidate', candidate);
    });
    const sdpAnswer = await endPoint.processOffer(sdpOffer);
    socket.send('answer', sdpAnswer);
    
    await endPoint.gatherCandidates();
}

function addCandidate(socket, candidate) {
    candidate = kurento.getComplexType('IceCandidate')(candidate);
    if (socket.endPoint) {
        socket.endPoint.addIceCandidate(candidate);
    } else {
        socket.candidates.push(candidate);
    }
}
