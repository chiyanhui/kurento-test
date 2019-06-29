var nspList = ['/test1', '/test2'];

module.exports = (io) => {
    nspList.forEach(nsp => {
        io.of(nsp).on('connection', require('.' + nsp));
    });
};
