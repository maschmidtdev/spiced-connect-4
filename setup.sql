-- drop existing games table
DROP TABLE IF EXISTS games;
-- drop existing users table
DROP TABLE IF EXISTS users;

-- create a new users table
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(50) NOT NULL UNIQUE,
  username      VARCHAR(255) NOT NULL,
  password_hash VARCHAR NOT NULL,
  image_url     TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- create a new games table
CREATE TABLE games (
  id            SERIAL PRIMARY KEY,
  player_1      INTEGER REFERENCES users(id) NOT NULL,
  player_2      INTEGER REFERENCES users(id) NOT NULL,
  turn          INTEGER REFERENCES users(id) NOT NULL,
  gamestate     TEXT,
  winner        TEXT DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- create some users
INSERT INTO users (email, username, password_hash, image_url) VALUES ('maschmidt.dev@gmail.com', 'Marcel', '$2a$10$m950MC86TmZaYB24KphuTOxF94/wsqoBU0vFCDYNiwrDNo0XzinRu', 'https://s3.amazonaws.com/marcelimageboard/QRndv93PB6D29LUHb1raxXTbNyNfvz_d.jpeg');
INSERT INTO users (email, username, password_hash, image_url) VALUES ('hannah@gmail.com', 'Hannah', '$2a$10$m950MC86TmZaYB24KphuTOxF94/wsqoBU0vFCDYNiwrDNo0XzinRu', 'https://images-na.ssl-images-amazon.com/images/M/MV5BMzMyMDczMzMwN15BMl5BanBnXkFtZTYwOTc4MTY1._V1_UX172_CR0,0,172,256_AL_.jpg');
INSERT INTO users (email, username, password_hash, image_url) VALUES ('lucas@gmail.com', 'Lucas', '$2a$10$m950MC86TmZaYB24KphuTOxF94/wsqoBU0vFCDYNiwrDNo0XzinRu', 'https://images-na.ssl-images-amazon.com/images/M/MV5BNTczMzk1MjU1MV5BMl5BanBnXkFtZTcwNDk2MzAyMg@@._V1_UY256_CR2,0,172,256_AL_.jpg');

-- create some games
INSERT INTO games (player_1, player_2, turn, gamestate) VALUES (1, 2, 1, '[0,0,0,0,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,0,0,0,0,2,0,0,0,0,0,1]');
INSERT INTO games (player_1, player_2, turn, gamestate) VALUES (2, 3, 2, '[0,0,0,0,0,2,0,0,0,0,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,0,0,0,0,2]');
INSERT INTO games (player_1, player_2, turn, gamestate) VALUES (3, 1, 3, '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]');