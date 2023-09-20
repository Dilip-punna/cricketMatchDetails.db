const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initilizationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at 3000 ");
    });
  } catch (e) {
    console.log(`DB server Error${e.message}`);
    process.exit(1);
  }
};

initilizationDBAndServer();

const convertPlayerDBObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertmatchDBObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getplayerQuery = `
        SELECT
         *
        FROM 
          player_details;`;
  const playerArray = await db.all(getplayerQuery);
  response.send(
    playerArray.map((eachplayer) => convertPlayerDBObject(eachplayer))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getplayerQuery = `
  SELECT
    *
  FROM
    player_details
  WHERE
    player_id=?;`;
  const player = await db.get(getplayerQuery, playerId);

  response.send(convertPlayerDBObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `
  UPDATE 
    player_details 
  SET  
    player_name='${playerName}'
  WHERE 
    player_id=${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
  SELECT
   * 
  FROM
   match_details
  WHERE 
    match_id=${matchId};`;
  const player = await db.get(matchQuery);
  response.send(convertmatchDBObject(player));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
  SELECT
   * 
  FROM
   player_match_score
    NATURAL JOIN match_details
  WHERE 
    player_id=${playerId};`;
  const playerMatches = await db.all(getPlayerMatchQuery);
  response.send(playerMatches.map((each) => convertmatchDBObject(each)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerMatchQuery = `
  SELECT
   * 
  FROM
   player_match_score
    NATURAL JOIN player_details
  WHERE 
    match_id=${matchId};`;
  const playerMatches = await db.all(getMatchPlayerMatchQuery);
  response.send(playerMatches.map((each) => convertPlayerDBObject(each)));
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerMatchQuery = `
  SELECT
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) As totalSixes
  FROM
    player_match_score
    NATURAL JOIN player_details
  WHERE
    player_id=?;`;
  const playerMatches = await db.get(getMatchPlayerMatchQuery, playerId);

  response.send(playerMatches);
});

module.exports = app;
