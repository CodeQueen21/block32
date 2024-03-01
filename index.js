const pg = require("pg");
const express = require("express");

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_notes_db"
); //Client instance of pg --- this is an environment variable

const app = express();
app.use(express.json()); //parse incoming requests
app.use(require("morgan")("dev")); //logs our requests as they come in

//routes for CRUD(create, read, update, delete) operation

app.post("/api/notes", async (req, res, next) => {
  try {
    const SQL = `
        INSERT INTO notes(txt) 
        VALUES($1)
        RETURNING *
        `;
    const response = await client.query(SQL, [req.body.txt]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
}); //CREATE

app.get("/api/notes", async (req, res, next) => {
  try {
    const SQL = `
          SELECT * from notes ORDER BY created_at DESC;
          `;
    const response = await client.query(SQL);
    res.send(response.rows); //sends the response back w/ the rows of entries it found
  } catch (error) {
    next(error);
  }
}); //READ

app.put("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = `
        UPDATE notes
        SET txt=$1, ranking=$2, updated_at= now()
        WHERE id=$3 RETURNING *
        `;
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.ranking,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
}); //UPDATE

app.delete("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = `
    DELETE from notes
    WHERE id = $1
    `;
    const response = await client.query(SQL, [req.params.id]); //req params obtains the id from the route, specifically :id
    res.sendStatus(204); //status code that the item was successfully deleted
  } catch (error) {
    next(error);
  }
}); //DELETE

const init = async () => {
  await client.connect();
  console.log("connected to database");
  let SQL = `
  DROP TABLE IF EXISTS notes;
CREATE TABLE notes(
id SERIAL PRIMARY KEY,
created_at TIMESTAMP DEFAULT now(),
updated_at TIMESTAMP DEFAULT now(),
ranking INTEGER DEFAULT 3 NOT NULL,
txt VARCHAR(255) NOT NULL
);
  `;
  await client.query(SQL);
  console.log("table created");
  SQL = `
   INSERT INTO notes(txt, ranking) VALUES('learn express', 5);
   INSERT INTO notes(txt, ranking) VALUES('write SQL queries', 4);
   INSERT INTO notes(txt, ranking) VALUES('create routes', 2);
  `;
  await client.query(SQL);
  console.log("data seeded");
  const port = process.env.PORT || 3000; // port is taken from your environment or 3000
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
