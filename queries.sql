-- Create a database in postgres
-- name:todolist
-- password:123456! 

DROP TABLE IF EXISTS users, lists, items;

CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  users_name VARCHAR(15) UNIQUE NOT NULL,
  color VARCHAR(15)
);

CREATE TABLE lists(
  id SERIAL PRIMARY KEY,
  lists_name TEXT NOT NULL,
  user_id INT REFERENCES NOT NULL users(id)
);

CREATE TABLE items(
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  creation_date DATE NOT NULL,
  lists_id INT REFERENCES lists(id),
  users_id INT REFERENCES users(id) 
);

INSERT INTO users (id,users_name, color) VALUES (1,'Monica','#a683e3'),(2,'Matt','#6a93d9');
INSERT INTO lists (id,lists_name, user_id) VALUES (1,'Today',1),(2,'Week',1),(3,'Month',1);
INSERT INTO lists (id,lists_name, user_id) VALUES (4,'Today',2),(5,'Week',2),(6,'Month',2);
INSERT INTO items (title ,creation_date, lists_id, users_id) VALUES ('Buy milk','2024-10-26',1,1),('Wash car','2024-10-26',2,1),('Finish project','2024-10-26',3,1),('Capstone Project','2024-10-26',1,1),('Nails','2024-10-26',2,1),('Hair cut','2024-10-26',3,1);
INSERT INTO items (title ,creation_date, lists_id, users_id) VALUES ('Call Accountant','2024-10-26', 4,2),('Budget','2024-10-26',5,2),('Book Soft Play','2024-10-26',6,2),('Book Hollidays','2024-10-26',4,2),('Book hotel','2024-10-26',5,2),('Dog Vets','2024-10-26',6,2);






