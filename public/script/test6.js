let peerConnection = new RTCPeerConnection();
peerConnection.onicecandidate = onIcecandidate;
peerConnection.onaddstream = onAddstream;
function onIcecandidate(event) {
    if (event.candidate) {
        let candidate = event.candidate;
        socket.send({
            type: 'candidate',
            id: candidate.sdpMid,
            label: candidate.sdpMLineIndex,
            candidate: candidate.candidate,
        });
    }
}
function onAddstream(event) {
    console.log(event.stream);
    remoteVideo.srcObject = event.stream;
}

function acceptOffer(offerSdp) {
    let description = new RTCSessionDescription(offerSdp);
    peerConnection.setRemoteDescription(description);
    navigator.mediaDevices.getUserMedia({
        // audio: true,
        video: { width: 350, height: 350 },
    }).then(res => {
        localVideo.srcObject = res;
        peerConnection.addStream(res);
        peerConnection.createAnswer().then(sdp => {
            peerConnection.setLocalDescription(sdp);
            socket.send(sdp);
        });
    }).catch(() => {
        peerConnection.createAnswer().then(sdp => {
            peerConnection.setLocalDescription(sdp);
            socket.send(sdp);
        });
    });
}

function addCandidate(data) {
    candidate = new RTCIceCandidate({
        sdpMLineIndex: data.label,
        sdpMid: data.id,
        candidate: data.candidate,
    });
    // console.log(candidate);
    peerConnection.addIceCandidate(candidate);
}

var socket = io('/test6', {
    transports: ['websocket'],
    reconnection: false, 
});

socket.on('message', function(msg) {
    console.log('message: ', msg);
    if (!msg) {
        return;
    }
    if (msg.type === 'offer') {
        acceptOffer(msg);
    } else if (msg.type === 'candidate') {
        addCandidate(msg);
    }
});

socket.emit('join', function(msg) {
    console.log(msg);
});
