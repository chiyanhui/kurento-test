const kurento = require('../util/kurento');
const PipelineTask = kurento.PipelineTask;
let client;
(async function() {
    client = await kurento.getKurentoClient();
})();
let presenterQueue = [], viewerQueue = [];
module.exports = socket => {
    socket.on('message', function(type, data) {
        switch(type) {
            case 'presenter': {
                if (presenterQueue.includes(socket)) {
                    return;
                }
                socket.candidates = [];
                if (viewerQueue.length === 0) {
                    presenterQueue.push(socket);
                    socket.pipelineTask = new PipelineTask(client);
                    socket.initTask = initSocket(socket, data.sdp);
                } else {
                    let viewer = viewerQueue.shift();
                    socket.pipelineTask = viewer.pipelineTask;
                    socket.initTask = initSocket(socket, data.sdp);
                    start(socket, viewer);
                }
                break;
            }
            case 'viewer': {
                if (viewerQueue.includes(socket)) {
                    return;
                }
                socket.candidates = [];
                if (presenterQueue.length === 0) {
                    viewerQueue.push(socket);
                    socket.pipelineTask = new PipelineTask(client);
                    socket.initTask = initSocket(socket, data.sdp);
                } else {
                    let presenter = presenterQueue.shift();
                    socket.pipelineTask = presenter.pipelineTask;
                    socket.initTask = initSocket(socket, data.sdp);
                    start(presenter, socket);
                }
                break;
            }
            case 'candidate': {
                addCandidate(socket, data);
                break;
            }
        }
    });
    socket.on('disconnecting', function() {
        if (presenterQueue.includes(socket)) {
            presenterQueue.splice(presenterQueue.indexOf(socket), 1);
        }
        if (viewerQueue.includes(socket)) {
            viewerQueue.splice(viewerQueue.indexOf(socket), 1);
        }
        if (socket.pipelineTask) {
            socket.pipelineTask.release();
        }
    });
}
async function initSocket(socket, sdpOffer) {
    const pipeline = await socket.pipelineTask.getPipeline();
    const endPoint = await pipeline.create('WebRtcEndpoint');
    socket.endPoint = endPoint;
    const composite = await socket.pipelineTask.getComposite();
    const hubPort = await composite.createHubPort();
    endPoint.connect(hubPort);
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
}
async function start(presenter, viewer) {
    await presenter.initTask;
    await viewer.initTask;
    const pipelineTask = presenter.pipelineTask;
    const pipeline = await pipelineTask.getPipeline();
    const composite = await pipelineTask.getComposite();
    const recorder = await pipeline.create('RecorderEndpoint', {uri : 'file:///tmp/kurento/video' + Date.now() + '-' + (Math.random()+'').substring(2,6) + '.webm'});
    const hubPort = await composite.createHubPort();
    hubPort.connect(recorder);
    presenter.endPoint.connect(viewer.endPoint);
    viewer.endPoint.connect(presenter.endPoint);
    recorder.record();
}

function addCandidate(socket, candidate) {
    candidate = kurento.getComplexType('IceCandidate')(candidate);
    if (socket.endPoint) {
        socket.endPoint.addIceCandidate(candidate);
    } else {
        socket.candidates.push(candidate);
    }
}
