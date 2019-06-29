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
    socket.on('disconnecting', async function() {
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
    // 注意文件夹权限, `chown kurento:kurento /tmp/kurento`
    const recorder = await pipeline.create('RecorderEndpoint', {uri : 'file:///tmp/kurento/video' + Date.now() + '.webm'});
    await endPoint.connect(recorder);

    endPoint.on('OnIceCandidate', function(event) {
        var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
        socket.send('candidate', candidate);
    });
    const sdpAnswer = await endPoint.processOffer(sdpOffer);
    socket.send('answer', sdpAnswer);
    
    await endPoint.gatherCandidates();
    await recorder.record();
}

function addCandidate(socket, candidate) {
    candidate = kurento.getComplexType('IceCandidate')(candidate);
    if (socket.endPoint) {
        socket.endPoint.addIceCandidate(candidate);
    } else {
        socket.candidates.push(candidate);
    }
}
