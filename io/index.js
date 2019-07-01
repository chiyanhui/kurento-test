var nspList = [
    '/test1', '/test2', '/test3', '/test4', '/test5',
    '/test6', '/test7', '/test8',
];

module.exports = (io) => {
    nspList.forEach(nsp => {
        io.of(nsp).on('connection', require('.' + nsp));
    });
};
