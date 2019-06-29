function createPeerConnection() {
    return new RTCPeerConnection({
        iceServers: [
            { url: 'stun:stun.voipstunt.com' },
            { url: 'stun:stun1.l.google.com:19302' },
            { url: 'stun:stun2.l.google.com:19302' },
            { url: 'stun:stun3.l.google.com:19302' },
            { url: 'stun:stun4.l.google.com:19302' },
        ],
    });
}
