(async function () {
    const path = require('path');
    const http = require('http');
    const express = require('express');
    const app = express();
    const server = http.createServer(app);
    const io = require('socket.io')(server, {
        allowRequest: (req, callback) =>
            callback(
                null,
                req.headers.referer.startsWith('http://localhost:3000')
            ),
    });
    const cookieSecret =
        process.env.COOKIE_SECRET || require('./secret.json').cookieSecret;
    const cookieSession = require('cookie-session');
    const cookieSessionMiddleware = cookieSession({
        secret: cookieSecret,
        maxAge: 1000 * 60 * 60 * 24 * 90,
    });
    const hashPassword = require('./hashPassword');
    const { compare } = require('bcryptjs');
    const {
        getUsers,
        getChallengers,
        getUserByEmail,
        getUserById,
        addWin,
        addLoss,
        createGame,
        getGames,
        getGame,
        getGameById,
        updateGame,
        acceptGame,
    } = require('./db');

    // Middleware

    function isLoggedIn(req, res, next) {
        if (req.session.user_id) return next();
        res.send('<h1>401 - Unauthorized</h1>');
    }

    app.use(
        express.urlencoded({
            extended: false,
        })
    );
    app.use(express.json());
    app.use(cookieSessionMiddleware);
    io.use(function (socket, next) {
        cookieSessionMiddleware(socket.request, socket.request.res, next);
    });
    // io.configure(function () {
    //     io.set('transports', ['xhr-polling']);
    //     io.set('polling duration', 10);
    // });

    // Set static folder
    app.use(express.static(path.join(__dirname, 'public')));

    // ==================== Routes ====================
    app.get('/api/user_id', async (req, res) => {
        // console.log('[server:/api/user_id] req.session:', req.session);
        const { user_id } = req.session;

        if (!user_id) {
            return res.json(null);
        }

        res.json(user_id);
    });
    app.get('/api/user', async (req, res) => {
        const { user_id } = req.session;

        const user = await getUserById(user_id);

        res.json(user);
    });
    app.get('/api/users', async (req, res) => {
        const challengers = await getChallengers(req.session.user_id);
        let users = await getUsers();
        // console.log('[server:/api/users] challengers:', challengers);

        users = users.filter((user) => {
            for (c of challengers) {
                if (user.id === c.id) {
                    return false;
                }
            }
            return true;
        });

        // console.log('[server:/api/users] users:', users);
        res.json({ challengers, users });
    });

    app.get('/api/user/:user_id', async (req, res) => {
        const { user_id } = req.params;
        const user = await getUserById(user_id);
        res.json(user);
    });
    app.get('/logout', (req, res) => {
        req.session = null;
        res.redirect('/');
    });
    app.post('/api/login', async (req, res) => {
        const { email, password } = req.body;
        const response = await getUserByEmail(email);
        if (response) {
            req.session.user_id = response.id;
        }
        res.redirect('/');
    });
    app.post('/api/challenge', async (req, res) => {
        const game = await getGame(req.body);
        if (game) {
            return res.status(500).json({
                error: 'Game with that user already exists!',
            });
        }
        const response = await createGame(req.body);
        games.push(response[0]);
        // console.log('[server:/api/challenge] response:', response);
        res.json(response);
    });
    app.post('/api/accept', async (req, res) => {
        const response = await acceptGame(req.body);
        games = games.filter((game) => game.id !== response[0].id);
        games.push({
            ...response[0],
            gamestate: JSON.parse(response[0].gamestate),
        });
        res.json(response);
    });
    app.get('/api/games', async (req, res) => {
        const response = await getGames();
        res.json(response);
    });
    app.get('/api/game/:game_id', async (req, res) => {
        const response = await getGameById(req.params.game_id);
        res.json(response);
    });

    app.get('/register', function (req, res) {
        if (req.session.user_id) {
            return res.redirect('/');
        }

        res.sendFile(path.join(__dirname, 'public', 'register.html'));
    });
    app.post('/api/register', (req, res) => {
        const { password } = req.body;

        hashPassword(password).then((password_hash) => {
            createUser({ ...req.body, password_hash })
                .then((result) => {
                    // console.log("[register] result", result);
                    res.json({ result });
                    // res.sendStatus(200);
                })
                .catch((error) => {
                    console.log('[server:api/register] error:', error);
                    res.status(500).json({ error: 'Email already taken' });
                    // res.status(500).json({ error: "Invalid code" });
                });
        });
    });
    app.get('/', function (req, res) {
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    app.get('*', function (req, res) {
        if (req.session.user_id) {
            return res.sendFile(path.join(__dirname, 'public', 'index.html'));
        }
        res.redirect('/');
    });

    // ==================== GAME // IO ====================

    // Game init

    var games = await getGames();
    for (game of games) {
        game.gamestate = JSON.parse(game.gamestate);
    }
    // console.log('[server] games', games);

    var clients = [];
    var currentPlayer;
    var gameBoard;
    var gameFinished;
    init();

    // Run when client connects
    io.on('connection', (socket) => {
        // Welcome current user
        socket.emit('message', 'Welcome!');
        console.log(
            'Socket connected:',
            socket.id,
            socket.request.session.user_id
        );

        socket.emit('update', gameBoard);

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

        // Join a room
        socket.on('join_room', (game_id) => {
            socket.join(game_id.toString());
            socket.to(game_id.toString()).emit('user_joined', game_id);
        });

        // Broadcast when a user connects
        // socket.broadcast.emit('message', 'A user jas joined the game');

        //  Runs when client disconnects
        socket.on('disconnect', () => {
            // io.emit('message', 'A user has left the game');
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

        socket.on('modal', ({ message, command }) => {
            socket.emit('modal', { message, command });
        });

        // Player clicks
        socket.on('place_tile', async ({ col, game_id, user_id }) => {
            console.log('[server:socket:place_tile]');
            // Get the current game
            var game = games.filter((game) => game.id == game_id)[0];
            // Determine if its this players turn, exit if no
            if (game.turn !== user_id || game.winner) {
                return;
            }

            // Get the row and place tile
            var row = server_placeTile(col, game);
            // Exit if column is full
            if (row < 0) {
                return;
            }

            // Do the victory check
            var checkPositions = [];
            var colPositions = server_getColPositions(col);
            var rowPositions = server_getRowPositions(row);
            var topDiagonal = server_getTopDiagonal(col, row);
            var bottomDiagonal = server_getBottomDiagonal(col, row);
            checkPositions.push(colPositions);
            checkPositions.push(rowPositions);
            checkPositions.push(topDiagonal);
            checkPositions.push(bottomDiagonal);

            // If game isn't over
            if (!server_checkVictory(game, checkPositions, 0)) {
                // Switch the active turn
                game.turn =
                    game.turn === game.player_1 ? game.player_2 : game.player_1;
            } else {
                const loser_id =
                    game.turn === game.player_1 ? game.player_2 : game.player_1;
                const loss = await addLoss(loser_id);
                const win = await addWin(game.turn);

                console.log('[server:] vitory:', win, loss);
            }

            // console.log('[server:place_tile] game:', game);

            updateGame(game).then(() => {
                io.to(game_id.toString()).emit('game_update', game);
            });
        });

        socket.on('click', (col) => {
            if (
                clients.indexOf(socket.id) !== currentPlayer - 1 ||
                gameFinished
            ) {
                return;
            }

            var row = placeTile(col);
            // var server_row = server_placeTile(col);

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

            if (checkVictory(checkPositions, 0)) {
                gameFinished = true;
            } else {
                switchTurn();
            }
        });

        socket.on('reset', () => {
            init();
            io.sockets.emit('reset');
        });
    });

    function init() {
        currentPlayer = 1;
        gameFinished = false;
        gameBoard = [];
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
    function server_placeTile(col, game) {
        for (var i = (col + 1) * 6 - 1; i >= (col + 1) * 6 - 6; i--) {
            if (game.gamestate[i] == 0) {
                game.gamestate[i] =
                    game.turn === game.player_1 ? game.player_1 : game.player_2;
                // console.log('[server_placeTile] gamestate:', game.gamestate);
                return i - col * 6;
            }
        }
        return -1;
    }

    function server_getColPositions(col) {
        var positions = [];
        for (i = col * 6; i <= col * 6 + 5; i++) {
            positions.push(i);
        }
        return positions;
    }
    function server_getRowPositions(row) {
        var positions = [];
        for (var i = 0; i <= 6; i++) {
            positions.push(i * 6 + row);
        }
        return positions;
    }
    function server_getTopDiagonal(col, row) {
        var positions = [];

        // Get top left position of diagonal
        while (col > 0 && row > 0) {
            col--;
            row--;
        }

        // Add positions diagonally down
        while (row <= 5 && col <= 6) {
            positions.push(col * 6 + row);
            row++;
            col++;
        }
        return positions;
    }
    function server_getBottomDiagonal(col, row) {
        var positions = [];

        // Get bottom left position of diagonal
        while (col > 0 && row < 5) {
            col--;
            row++;
        }

        // Add positions diagonally up
        while (row >= 0 && col <= 6) {
            positions.push(col * 6 + row);
            row--;
            col++;
        }
        return positions;
    }

    function server_checkVictory(game, checkPositions, index) {
        if (index >= checkPositions.length) {
            return false;
        } else {
            var count = 0;
            var winPositions = [];

            for (var i = 0; i < checkPositions[index].length; i++) {
                var current = checkPositions[index][i];

                if (game.gamestate[current] === game.turn) {
                    winPositions.push(current);
                    count++;
                    if (count >= 4) {
                        game.winner = JSON.stringify(winPositions);
                        return true;
                    }
                } else {
                    count = 0;
                    winPositions = [];
                }
            }
            return server_checkVictory(game, checkPositions, index + 1);
        }
    }

    // Start server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
