const spicedPg = require('spiced-pg');
const hashPassword = require('./hashPassword');
const database = 'connectfour';

var dbUrl;
if (process.env.NODE_ENV === 'production') {
    dbUrl = process.env.DATABASE_URL;
} else {
    const { username, password } = require('./secrets.json');
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

// Games
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

module.exports = {
    createUser,
    getUserByEmail,
    getUserById,
    getGames,
    getGameById,
    updateGame,
};
