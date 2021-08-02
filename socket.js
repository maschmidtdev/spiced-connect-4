import { io } from 'socket.io-client';

export let socket;

export const init = () => {
    console.log('init');
    if (!socket) {
        socket = io.connect();

        socket.on('message', (message) => {
            console.log(message);
        });

        socket.on('update', (gameBoard) => {
            $positions = $('.position');
            for (i in gameBoard) {
                if (gameBoard[i] !== 0) {
                    $positions.eq(i).addClass(`player-${gameBoard[i]}`);
                } else {
                    $positions
                        .eq(i)
                        .removeClass('player-1')
                        .removeClass('player-2');
                }
            }
        });

        socket.on('player 1', function () {
            $('#player').html(
                `   
            <h1>
                You are <span class="player-1">Player 1. </span>
                <span id="turn"> Its your turn!</span>
                <span id="win"> You won :D</span>
                <span id="lose"> You lost :(</span>
            </h1>
            <button>Play again</button>
            `
            );
        });

        socket.on('player 2', function () {
            $('#player').html(
                `   
            <h1>
                You are <span class="player-2">Player 2. </span>
                <span id="turn">Its your turn!</span>
                <span id="win">You won :D</span>
                <span id="lose">You lost :(</span>
            </h1>
            <button>Play again</button>
            `
            );
        });

        socket.on('turn', function (turn) {
            if (turn) {
                $('#turn').addClass('turn');
            } else {
                $('#turn').removeClass('turn');
            }
        });

        socket.on('placeTile', ({ index, player }) => {
            $('.position')
                .eq(index)
                .addClass('player-' + player);
        });

        socket.on('finish', function ({ positions, player }) {
            for (p of positions) {
                $('.position').eq(p).addClass('win');
            }
            var $playerSpan = $('#player span:first-of-type');
            if (player === 1) {
                var winner = 1;
                var loser = 2;
            } else {
                var winner = 2;
                var loser = 1;
            }

            if ($playerSpan.hasClass(`player-${winner}`)) {
                $('button').addClass('finished');
                $('#win').addClass('win');
            } else if ($playerSpan.hasClass(`player-${loser}`)) {
                $('button').addClass('finished');
                $('#lose').addClass('lose');
            }
        });

        socket.on('reset', function () {
            reset();
        });
    }
    console.log('socket:', socket);
};
