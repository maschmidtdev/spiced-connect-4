(function () {
    const socket = io();
    var el;

    socket.on('message', (message) => {
        console.log(message);
    });

    socket.on('time', function (timeString) {
        el = document.getElementById('server-time');
        el.innerHTML = 'Server time: ' + timeString;
    });
})();
