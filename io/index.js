var nspList = ['/test1'];

module.exports = (io) => {
    nspList.forEach(nsp => {
        io.of(nsp).on('connection', require('.' + nsp));
    });
};
