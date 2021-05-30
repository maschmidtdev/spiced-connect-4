(function () {
    const path = require('path');
    const http = require('http');
    const express = require('express');
    const socketio = require('socket.io');
    const PORT = process.env.PORT || 3000;

    const app = express();
    const server = http.createServer(app);
    const io = socketio(server);

    // Set static folder
    app.use(express.static(path.join(__dirname, 'public')));

    var clients = [];
    var currentPlayer;
    var gameBoard = [];
    var gameFinished;
    init();

    // Run when client connects
    io.on('connection', (socket) => {
        // Welcome current user
        socket.emit('message', 'Welcome!');

        // Place client in array
        if (clients.length > 0 && clients[0] === 'waiting') {
            clients[0] = socket.id;
            socket.emit('player 1');
            socket.emit('turn', currentPlayer === 1);
        } else {
            clients.push(socket.id);
            if (clients.length === 1) {
                socket.emit('player 1');
                socket.emit('turn', currentPlayer === 1);
            } else if (clients.length === 2) {
                socket.emit('player 2');
                socket.emit('turn', currentPlayer === 2);
            }
        }

        // Broadcast when a user connects
        socket.broadcast.emit('message', 'A user jas joined the game');

        //  Runs when client disconnects
        socket.on('disconnect', () => {
            io.emit('message', 'A user has left the game');
            // If player 1 disconnects
            if (clients.indexOf(socket.id) === 0) {
                // If there are spectators
                if (clients.length >= 3) {
                    clients[0] = clients[2]; // Make first spectator (index 2) new player 1
                    socket.to(clients[0]).emit('player 1');
                    socket.to(clients[0]).emit('turn', currentPlayer === 1);
                    clients.splice(2, 1); // Remove previous spectator position from clients array
                    // If there are just the two players
                } else if ((clients.length = 2)) {
                    clients[0] = 'waiting'; // reserve Player 1 spot for the next connection
                    // just empty array if player 1 was the only client
                } else {
                    clients = [];
                }
                // If player 2 disconnects
            } else if (clients.indexOf(socket.id) === 1) {
                // If player 1 pending
                if (clients[0] === 'waiting') {
                    clients = []; // reset clients
                    //  If there are spectators
                } else if (clients.length >= 3) {
                    clients[1] = clients[2]; // Make first spectator (index 2) new player 2
                    socket.to(clients[1]).emit('player 2');
                    socket.to(clients[1]).emit('turn', currentPlayer === 2);
                    clients.splice(2, 1); // Remove previous spectator position from clients array
                }
            } else {
                clients.splice(clients.indexOf(socket.id, 1));
            }
            clients = clients.filter((client) => client !== socket.id);
        });

        // Player clicks
        socket.on('click', (col) => {
            if (
                clients.indexOf(socket.id) !== currentPlayer - 1 ||
                gameFinished
            ) {
                return;
            }

            var row = placeTile(col);

            if (row < 0) {
                return;
            }

            io.sockets.emit('placeTile', {
                index: col * 6 + row,
                player: currentPlayer,
            });

            var checkPositions = [];
            var colPositions = getColPositions(col);
            var rowPositions = getRowPositions(row);
            var topDiagonal = getTopDiagonal(col, row);
            var bottomDiagonal = getBottomDiagonal(col, row);

            checkPositions.push(colPositions);
            checkPositions.push(rowPositions);
            checkPositions.push(topDiagonal);
            checkPositions.push(bottomDiagonal);

            if (!checkVictory(checkPositions, 0)) {
                switchTurn();
            } else {
                gameFinished = true;
                console.log('Player ' + currentPlayer + ' won!');
            }
        });
    });

    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    function init() {
        currentPlayer = 1;
        gameFinished = false;
        var n = 42;
        while (n > 0) {
            gameBoard.push(0);
            n--;
        }
    }

    function placeTile(col) {
        for (var i = (col + 1) * 6 - 1; i >= (col + 1) * 6 - 6; i--) {
            if (gameBoard[i] == 0) {
                gameBoard[i] = currentPlayer;
                return i - col * 6;
            }
        }
        return -1;
    }

    function getColPositions(col) {
        var positions = [];
        for (i = col * 6; i <= col * 6 + 5; i++) positions.push(gameBoard[i]);
        return positions;
    }
    function getRowPositions(row) {
        var positions = [];
        for (var i = 0; i <= 6; i++) {
            positions.push(gameBoard[i * 6 + row]);
        }
        return positions;
    }
    function getTopDiagonal(col, row) {
        var positions = [];

        // Get top left position of diagonal
        while (col > 0 && row > 0) {
            col--;
            row--;
        }

        // Add positions diagonally down
        while (row <= 5 && col <= 6) {
            positions.push(gameBoard[col * 6 + row]);
            row++;
            col++;
        }
        return positions;
    }
    function getBottomDiagonal(col, row) {
        var positions = [];

        // Get bottom left position of diagonal
        while (col > 0 && row < 5) {
            col--;
            row++;
        }

        // Add positions diagonally up
        while (row >= 0 && col <= 6) {
            positions.push(gameBoard[col * 6 + row]);
            row--;
            col++;
        }
        return positions;
    }

    function checkVictory(checkPositions, index) {
        if (index >= checkPositions.length) {
            return false;
        } else {
            var count = 0;
            var winPositions = [];

            for (var i = 0; i < checkPositions[index].length; i++) {
                var current = checkPositions[index][i];

                if (current === currentPlayer) {
                    // console.log('current', current);
                    // console.log('currentPlayer', currentPlayer);
                    winPositions.push(current);
                    count++;
                    if (count >= 4) {
                        return true;
                    }
                } else {
                    count = 0;
                    winPositions = [];
                }
            }
            return checkVictory(checkPositions, index + 1);
        }
    }

    function switchTurn() {
        if (currentPlayer === 1) {
            currentPlayer++;
            io.to(clients[0]).emit('turn', false);
            io.to(clients[1]).emit('turn', true);
        } else {
            currentPlayer = 1;
            io.to(clients[0]).emit('turn', true);
            io.to(clients[1]).emit('turn', false);
        }
    }
})();
