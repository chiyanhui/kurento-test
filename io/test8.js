const kurento = require('../util/kurento');
let client;
(async function() {
    client = await kurento.getKurentoClient();
})();

module.exports = socket => {
    socket.on('start', function() {
        socket.candidates = [];
        start(socket);
    });
    socket.on('message', function(data) {
        // console.log(data);
        switch (data.type) {
            case 'answer': {
                console.log('-----answer-----');
                acceptAnswer(socket, data.sdp);
                break;
            }
            case 'candidate': {
                console.log('-----get candidate-----');
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

async function start(socket) {
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
        console.log('-----send candidate-----');
        socket.send({
            type: 'candidate', 
            candidate: candidate.candidate,
            id: candidate.sdpMid,
            label: candidate.sdpMLineIndex,
        });
    });
    const sdpOffer = await endPoint.generateOffer();
    socket.send({ type: 'offer', sdp: sdpOffer});
}

async function acceptAnswer(socket, sdpAnswer) {
    const endPoint = socket.endPoint;
    await endPoint.processAnswer(sdpAnswer);
    while(socket.candidates.length) {
        var candidate = socket.candidates.shift();
        endPoint.addIceCandidate(candidate);
    }
    await endPoint.gatherCandidates();
}

function addCandidate(socket, data) {
    const candidate = kurento.getComplexType('IceCandidate')({
      candidate: data.candidate,
      sdpMid: data.id,
      sdpMLineIndex: data.label,
    });
    if (socket.endPoint) {
        socket.endPoint.addIceCandidate(candidate);
    } else {
        socket.candidates.push(candidate);
    }
}
