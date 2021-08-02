(function () {
    //  ===================== Socket handling ==========================

    const socket = io();
    // import { init, socket } from '../../socket';
    // init();

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

    // socket.on('placeTile', ({ index, player }) => {
    //     $('.position')
    //         .eq(index)
    //         .addClass('player-' + player);
    // });

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

    //  ===================== HEADER ==========================
    const headertop = Vue.component('headertop', {
        template: '#headertop',
        data: function () {
            return {
                user: null,
                loading: true,
            };
        },
        mounted: async function () {
            const { data } = await axios.get('/api/user');
            this.user = data;
            this.loading = false;
        },
    });

    //  ===================== WELCOME ==========================
    const welcome = Vue.component('welcome', {
        template: '#welcome',
        data: function () {
            return {};
        },
        mounted: function () {},
        watch: {},
        methods: {},
    });
    const login = Vue.component('login', {
        props: ['user_id'],
        template: '#login',
        data: function () {
            return {};
        },
        mounted: async function () {},
        watch: {},
        methods: {},
    });

    //  ===================== APP ==========================
    const app = Vue.component('app', {
        props: ['user'],
        template: '#app',
        data: function () {
            return {};
        },
        mounted: function () {},
        watch: {},
        methods: {},
    });
    const profile = Vue.component('profile', {
        template: '#profile',
        data: function () {
            return {
                user: null,
                loading: true,
            };
        },
        mounted: async function () {
            const { data } = await axios.get('/api/user');
            this.user = data;
            this.loading = false;
        },
        watch: {},
        methods: {},
    });

    //  ===================== GAME ==========================

    const gamelist = Vue.component('gamelist', {
        template: '#gamelist',
        data: function () {
            return {
                loading: true,
                games: null,
            };
        },
        mounted: async function () {
            const { data } = await axios.get('/api/games');
            this.games = data;
            // console.log('[client:gamelist] games:', this.games);
            let player_1, player_2;
            for (id in this.games) {
                // console.log('id', id);
                // console.log('gamers[id]', this.games[id].player_1);
                player_1 = await axios.get(
                    `/api/user/${this.games[id].player_1}`
                );
                player_2 = await axios.get(
                    `/api/user/${this.games[id].player_2}`
                );
                this.games[id].player_1 = player_1.data;
                this.games[id].player_2 = player_2.data;
            }

            this.loading = false;
        },
        watch: {},
        methods: {},
    });
    const game = Vue.component('game', {
        props: ['game_id', 'user'],
        template: '#game',
        data: function () {
            return {
                game: {},
                loading: true,
            };
        },
        mounted: async function () {
            const { data } = await axios.get(`/api/game/${this.game_id}`);
            if (!data) {
                this.$router.push('/');
            }
            this.game = {
                ...data,
                gamestate: JSON.parse(data.gamestate),
            };
            const player_1 = await axios.get(`/api/user/${this.game.player_1}`);
            const player_2 = await axios.get(`/api/user/${this.game.player_2}`);
            this.game.player_1 = player_1.data;
            this.game.player_2 = player_2.data;
            console.log('game', this.game);

            socket.emit('join_room', this.game_id);
            socket.on('user_joined', (game_id) => {
                console.log('A user joined the game:', game_id);
            });
            socket.on('game_update', (game) => {
                this.game.turn = game.turn;
                this.game.gamestate = game.gamestate;
                this.game.winner = game.winner;
                console.log('client: game', this.game);
            });
            socket.on('placeTile', ({ index, player }) => {
                console.log('[placeTile]');
                $('.position')
                    .eq(index)
                    .addClass('player-' + player);
            });
            this.loading = false;
        },
        watch: {},
        methods: {
            someFunction: function () {
                console.log('test');
            },
        },
    });
    const game_column = Vue.component('game-column', {
        props: ['col', 'game'],
        template: '#game-column',
        data: function () {
            return {
                loading: true,
                user: null,
            };
        },
        mounted: async function () {
            const { data } = await axios.get('/api/user');
            this.user = data;
            this.loading = false;
        },
        watch: {},
        methods: {
            onClick: function () {
                
                socket.emit('place_tile', {
                    col: this.col,
                    game_id: this.game.id,
                    user_id: this.user.id,
                });
            },
        },
    });
    const game_cell = Vue.component('game-cell', {
        props: ['position', 'game'],
        template: '#game-cell',
        data: function () {
            return {
                player: 0,
            };
        },
        mounted: function () {
            // console.log('[position]', this.position);
        },
        computed: {
            classObject: function () {
                return {
                    'player-1': this.game.gamestate[this.position] === 1,
                    'player-2': this.game.gamestate[this.position] === 2,
                };
            },
        },
        watch: {},
        methods: {},
    });

    //  ===================== ROUTES ==========================
    Vue.use(VueRouter);
    const routes = [
        { path: '/', component: gamelist },
        { path: '/game/:game_id', component: game, props: true },
        { path: '/profile', component: profile },
    ];
    const router = new VueRouter({ routes, mode: 'history' });

    //  ===================== MAIN ==========================
    new Vue({
        el: '#main',
        router,
        data: {
            loading: true,
            user_id: null,
        },
        mounted: async function () {
            const { data } = await axios.get('/api/user_id');
            this.user_id = data;
            this.loading = false;
        },
        methods: {},
    });

    var $board = $('.connect-four');
    var $columns = $board.find('.column');

    $columns.on('click', function () {
        var colIndex = $columns.index(this);
        socket.emit('click', colIndex);
    });

    $('#player').on('click', 'button', () => {
        socket.emit('reset');
    });

    function reset() {
        $('.position').removeClass('player-1');
        $('.position').removeClass('player-2');
        $('.win').removeClass('win');
        $('.lose').removeClass('lose');
        $('button').removeClass('finished');
        $playerSpan = $('#player');
        if ($playerSpan.hasClass('player-1')) {
            socket.to(socket.id).emit('player-1');
        } else if ($playerSpan.hasClass('player-2')) {
            socket.to(socket.id).emit('player-2');
            $('.turn').removeClass('turn');
        }
    }
})();
