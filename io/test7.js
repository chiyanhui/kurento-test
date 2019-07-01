const kurento = require('../util/kurento');
let client;
(async function() {
    client = await kurento.getKurentoClient();
})();

const room = 'room';
module.exports = socket => {
    socket.on('join', function(callback) {
        socket.join(room);
        if (typeof callback === 'function') {
          callback('joined successfully');
        }
    });
    socket.on('message', function(data) {
        // console.log(data);
        switch (data.type) {
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
        socket.send({
            type: 'candidate', 
            candidate: candidate.candidate,
            id: candidate.sdpMid,
            label: candidate.sdpMLineIndex,
        });
    });
    const sdpAnswer = await endPoint.processOffer(sdpOffer);
    socket.send({ type: 'answer', sdp: sdpAnswer});
    
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
