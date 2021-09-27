const spicedPg = require('spiced-pg');
const hashPassword = require('./hashPassword');
const database = 'connectfour';

var dbUrl;
if (process.env.NODE_ENV === 'production') {
    dbUrl = process.env.DATABASE_URL;
} else {
    const { username, password } = require('./secret.json');
    dbUrl = `postgres:${username}:${password}@localhost:5432/${database}`;
}

const db = spicedPg(dbUrl);

console.log(`[db] Connecting to: ${database}`);

// Users
function createUser(email, username, password_hash) {
    // console.log('[db:getUserByEmail]');
    return db
        .query(
            `INSERT INTO users (email, username, password_hash)
              VALUES ($1, $2, $3, $4) 
              RETURNING *`,
            [email, username, password_hash]
        )
        .then((result) => {
            // console.log(`[createUser] result.rows:`, result.rows);
            return result.rows;
        });
}
function getUserByEmail(email) {
    // console.log('[db:getUserByEmail]');
    return db
        .query(
            `SELECT * FROM users
                WHERE email = $1`,
            [email]
        )
        .then((result) => {
            // console.log('result.rows[0]', result.rows[0]);
            return result.rows[0];
        })
        .catch((error) => {
            console.log(error);
        });
}
function getUserById(id) {
    // console.log('[db:getUserById]');
    return db
        .query(
            `SELECT * FROM users
                WHERE id = $1`,
            [id]
        )
        .then((result) => {
            // console.log('result.rows[0]', result.rows[0]);
            return result.rows[0];
        })
        .catch((error) => {
            console.log(error);
        });
}
function getUsers() {
    // console.log('[db:getUsers');
    return db
        .query(`SELECT * FROM users`)
        .then((result) => {
            // console.log('result.rows', result.rows);
            return result.rows;
        })
        .catch((error) => {
            console.log(error);
        });
}
function getChallengers(user_id) {
    // console.log('[db:getChallengers');
    return db
        .query(
            `SELECT users.id, username, image_url FROM users
                JOIN games
                ON users.id = games.player_1
                WHERE games.accepted = false
                AND games.player_2 = $1`,
            [user_id]
            // [user_id]
        )
        .then((result) => {
            // console.log('[db:getChallengers] result.rows', result.rows);
            return result.rows;
        })
        .catch((error) => {
            console.log(error);
        });
}
function addWin(user_id) {
    // console.log('[db:addWin');
    return db
        .query(
            `UPDATE users SET wins = wins + 1
                WHERE id = $1
                RETURNING *`,
            [user_id]
            // [user_id]
        )
        .then((result) => {
            console.log('[db:addWin] result.rows', result.rows);
            return result.rows;
        })
        .catch((error) => {
            console.log(error);
        });
}
function addLoss(user_id) {
    // console.log('[db:addLoss');
    return db
        .query(
            `UPDATE users SET losses = losses + 1
                WHERE id = $1
                RETURNING *`,
            [user_id]
        )
        .then((result) => {
            console.log('[db:addLoss] result.rows', result.rows);
            return result.rows;
        })
        .catch((error) => {
            console.log(error);
        });
}

// Games
function createGame({ player_1, player_2 }) {
    return db
        .query(
            `INSERT INTO games (player_1, player_2, turn) 
                VALUES ($1, $2, $1)
                RETURNING *`,
            [player_1, player_2]
        )
        .then((result) => {
            // console.log('result.rows', result.rows);
            return result.rows;
        })
        .catch((error) => {
            console.log(error);
        });
}
function getGames() {
    // console.log('[db:getGames]');
    return db
        .query(`SELECT * FROM games ORDER BY id ASC`)
        .then((result) => {
            // console.log('result.rows', result.rows);
            return result.rows;
        })
        .catch((error) => {
            console.log(error);
        });
}
function getGamesByUser(user_id) {
    // console.log('[db:getGames]');
    return db
        .query(
            `SELECT * FROM games 
                WHERE player_1 = $1
                OR player_2 = $1
                ORDER BY id ASC`,
            [user_id]
        )
        .then((result) => {
            // console.log('result.rows', result.rows);
            return result.rows;
        })
        .catch((error) => {
            console.log(error);
        });
}
function getGameById(game_id) {
    // console.log('[db:getGames]');
    return db
        .query(`SELECT * FROM games WHERE id = $1`, [game_id])
        .then((result) => {
            // console.log('result.rows[0]', result.rows[0]);
            return result.rows[0];
        })
        .catch((error) => {
            console.log(error);
        });
}
function getGame({ player_1, player_2 }) {
    // console.log('[db:getGame]');
    return db
        .query(
            `SELECT * FROM games
            WHERE (player_1 = $1 AND player_2 = $2)
            OR (player_1 = $2 AND player_2 = $1)`,
            [player_1, player_2]
        )
        .then((result) => {
            // console.log('result.rows[0]', result.rows[0]);
            return result.rows[0];
        })
        .catch((error) => {
            console.log(error);
        });
}
function updateGame({ turn, gamestate, id, winner }) {
    return db
        .query(
            `UPDATE games SET turn = $1, gamestate = $2, winner = $3
              WHERE id = $4
              RETURNING *`,
            [turn, JSON.stringify(gamestate), winner, id]
        )
        .then((result) => {
            // console.log('[db:updateGame] result.rows', result.rows);
            return result.rows;
        })
        .catch((error) => {
            console.log(error);
        });
}
function acceptGame({ player_1, player_2 }) {
    return db
        .query(
            `UPDATE games SET accepted = true
              WHERE (player_1 = $1 AND player_2 = $2)
              OR (player_2 = $1 AND player_1 = $2)
              RETURNING *`,
            [player_1, player_2]
        )
        .then((result) => {
            // console.log('[db:acceptGame] result.rows', result.rows);
            return result.rows;
        })
        .catch((error) => {
            console.log(error);
        });
}

module.exports = {
    createUser,
    getUsers,
    getChallengers,
    getUserByEmail,
    getUserById,
    addWin,
    addLoss,
    createGame,
    getGames,
    getGame,
    getGamesByUser,
    getGameById,
    updateGame,
    acceptGame,
};
