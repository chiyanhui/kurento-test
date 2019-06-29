var socket = io.connect('/test1', {
    transports: [ 'websocket' ],
});

socket.on('message', function(type, data) {
    console.log(type, data);
    switch (type) {
        case 'answer': {
            peerConnection.setRemoteDescription(new RTCSessionDescription({type, sdp: data}));
            break;
        }
        case 'candidate': {
            peerConnection.addIceCandidate(new RTCIceCandidate(data));
            break;
        }
    }
});

var peerConnection = createPeerConnection();

navigator.mediaDevices.getUserMedia({
    audio: true,
    video: { width: 350, height: 350 }
}).then(stream => {
    console.log('------获取视频流成功------');
    localStream = stream;
    localVideo.srcObject = stream;
    peerConnection.addStream(localStream);
    createOffer();
}).catch(function (e) {
    console.error('------获取视频流失败------');
    console.error(e);
});

peerConnection.onicecandidate = onIcecandidate;
peerConnection.onaddstream = onAddstream;
function onIcecandidate(event) {
    console.log('-------onIcecandidate-------');
    if (event.candidate) {
        console.log(event.candidate);
        socket.send('candidate', event.candidate);
    }
}
function onAddstream(event) {
    console.log('-------onAddstream-------')
    console.log(event.stream);
    remoteStream = event.stream;
    remoteVideo.srcObject = event.stream;
}

function createOffer() {
    peerConnection.createOffer().then(sdp => {
        console.log('-------createOffer-------');
        console.log(sdp);
        peerConnection.setLocalDescription(sdp);
        socket.send('offer', sdp);
    });
}
