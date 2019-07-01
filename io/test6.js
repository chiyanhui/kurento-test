const room = 'room';

module.exports = socket => {
    socket.on('join', function(callback) {
        socket.join(room);
        if (typeof callback === 'function') {
          callback('joined successfully');
        }
    });
    socket.on('message', function(data) {
        socket.to(room).send(data);
    });
    socket.on('disconnecting', function() {
    });
}
