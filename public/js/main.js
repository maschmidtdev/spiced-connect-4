(function () {
    //  ===================== SERVER ==========================

    const socket = io();

    socket.on('message', (message) => {
        console.log(message);
    });

    socket.on('player 1', function () {
        console.log('You are now player 1!');
        $('#player').html(
            '<h1>You are <span class="player-1">Player 1</span>. <span id="turn"> Its your turn!</span></h1>'
        );
    });

    socket.on('player 2', function () {
        console.log('You are now player 2!');
        $('#player').html(
            '<h1>You are <span class="player-2">Player 2</span>. <span id="turn"> Its your turn!</span></h1>'
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
        console.log('index:', index, 'player:', player);
        $('.position')
            .eq(index)
            .addClass('player-' + player);
    });

    //  ===================== GAME ==========================

    var currentPlayer = 1;
    var $board = $('.connect-four');
    var $columns = $board.find('.column');

    var gameFinished = false;

    $columns.on('click', function () {
        // if (gameFinished) {
        //     return;
        // }
        var $columnPositions = $(this).find('.position');
        var colIndex = $columns.index(this);
        // var rowIndex = placeTile($columnPositions);

        socket.emit('click', colIndex);

        // if the column is already full
        //     if (rowIndex < 0) {
        //         return;
        //     }

        //     var $rowPositions = getRowPositions(rowIndex);
        //     var $topDiagonalPositions = getTopDiagonalPositions(rowIndex, colIndex);
        //     var $tbottomDiagonalPositions = getBottomDiagonalPositions(
        //         rowIndex,
        //         colIndex
        //     );
        //     var checkPositions = [];
        //     checkPositions.push($columnPositions);
        //     checkPositions.push($rowPositions);
        //     checkPositions.push($topDiagonalPositions);
        //     checkPositions.push($tbottomDiagonalPositions);

        //     if (!checkVictory(checkPositions, 0)) {
        //         switchPlayer();
        //     } else {
        //         gameFinished = true;
        //         $('#player').append('<button class="btn">Play again?</button>');
        //     }
    });

    // $('#player').on('click', 'button', () => reset());

    // function getTopDiagonalPositions(row, col) {
    //     var $diag = $();
    //     var $positions = $('.position');

    //     // Get top left position of the diagonal
    //     while (row > 0 && col > 0) {
    //         row--;
    //         col--;
    //     }
    //     // add positions diagonally down
    //     while (row <= 5 && col <= 6) {
    //         $diag = $diag.add($positions.eq(col * 6 + row));
    //         row++;
    //         col++;
    //     }
    //     return $diag;
    // }

    // function getBottomDiagonalPositions(row, col) {
    //     var $diag = $();
    //     var $positions = $('.position');

    //     // Get bottom left position of the diagonal
    //     while (row < 5 && col > 0) {
    //         row++;
    //         col--;
    //     }
    //     // add positions diagonally up
    //     while (row >= 0 && col <= 6) {
    //         $diag = $diag.add($positions.eq(col * 6 + row));
    //         row--;
    //         col++;
    //     }
    //     return $diag;
    // }

    // function getRowPositions(rowIndex) {
    //     var $row = $();

    //     for (var i = 0; i < $columns.length; i++) {
    //         var $column = $columns.eq(i);
    //         var $columnPositions = $column.find('.position');
    //         var $pos = $columnPositions.eq(rowIndex);
    //         $row = $row.add($pos);
    //     }

    //     return $row;
    // }

    // function checkVictory(checkPositions, index) {
    //     if (index < checkPositions.length) {
    //         var count = 0;
    //         var winPositions = [];

    //         for (var i = 0; i < checkPositions[index].length; i++) {
    //             var $current = checkPositions[index].eq(i);
    //             if ($current.hasClass('player-' + currentPlayer)) {
    //                 winPositions.push($current);
    //                 count++;
    //                 if (count >= 4) {
    //                     $('#player h1').text($('#player h1').text() + ' wins!');
    //                     for ($w of winPositions) {
    //                         $w.addClass('win');
    //                     }
    //                     return true;
    //                 }
    //             } else {
    //                 count = 0;
    //                 winPositions = [];
    //             }
    //         }

    //         return checkVictory(checkPositions, index + 1);
    //     } else {
    //         return false;
    //     }
    // }

    // function placeTile($columnPositions) {
    //     for (var i = $columnPositions.length - 1; i >= 0; i--) {
    //         var $current = $columnPositions.eq(i);
    //         var isTaken =
    //             $current.hasClass('player-1') || $current.hasClass('player-2');

    //         if (!isTaken) {
    //             $current.addClass('player-' + currentPlayer);
    //             return i;
    //         }
    //     }

    //     return -1;
    // }

    // function switchPlayer() {
    //     if (currentPlayer === 1) {
    //         currentPlayer = 2;
    //     } else {
    //         currentPlayer = 1;
    //     }
    //     $('#player span').html('' + currentPlayer);
    //     $('#player h1').toggleClass('player-1');
    //     $('#player h1').toggleClass('player-2');
    // }

    // function reset() {
    //     $('#player').html('<h1 class="player-1">Player <span>1</span></h1>');
    //     currentPlayer = 1;
    //     $positions = $('.position');
    //     $positions.removeClass('player-1');
    //     $positions.removeClass('player-2');
    //     $('.win').removeClass('win');
    //     gameFinished = false;
    // }
})();
