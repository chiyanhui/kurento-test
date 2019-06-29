const kurento = require('../util/kurento');
let client;
(async function() {
    client = await kurento.getKurentoClient();
})();

let waitingSocket = null; // 还未配对的socket, 和下一个接入的人配对

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
        if (waitingSocket === socket) {
            waitingSocket = null;
        }
    });
}

async function start(socket, sdpOffer) {
    const pipeline = waitingSocket ? waitingSocket.pipeline : await client.create('MediaPipeline');
    socket.pipeline = pipeline;
    const endPoint = await pipeline.create('WebRtcEndpoint');
    socket.endPoint = endPoint;
    while(socket.candidates.length) {
        var candidate = socket.candidates.shift();
        endPoint.addIceCandidate(candidate);
    }
    
    endPoint.on('OnIceCandidate', function(event) {
        var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
        socket.send('candidate', candidate);
    });
    const sdpAnswer = await endPoint.processOffer(sdpOffer);
    socket.send('answer', sdpAnswer);
    
    await endPoint.gatherCandidates();

    if (!waitingSocket) {
        waitingSocket = socket;
    } else {
        await waitingSocket.endPoint.connect(endPoint);
        await endPoint.connect(waitingSocket.endPoint);
        waitingSocket = null;
    }
}

function addCandidate(socket, candidate) {
    candidate = kurento.getComplexType('IceCandidate')(candidate);
    if (socket.endPoint) {
        socket.endPoint.addIceCandidate(candidate);
    } else {
        socket.candidates.push(candidate);
    }
}
