import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import dotenv from "dotenv";

// Configure dotenv package

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const db = new pg.Client(
    {
        user: process.env.PGUSER,   //use PGUSER as name only else will not work
        host: process.env.HOST,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
        port: process.env.DBPORT,
    }
);

db.connect();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let post = [];
const API_URL = "https://api.jikan.moe"

app.get("/", async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM myanilist ORDER BY id DESC");
      post = result.rows;
      res.render("index.ejs", {
        posts: post, 
        //img: " "
      });
    } catch (error) {
      console.log(error);
    }
  });
  

app.post("/addnew", async(req, res)=>{

    const aniname = req.body.addName;
    const desc = req.body.addtext;

    try {
      try {
        const result = await axios.get(API_URL + "/v4/anime", {
        params: {
          q: aniname,
        },
      });
      var img = result.data.data[0].images.webp.image_url;
      var MAL_score = result.data.data[0].score;
      } catch (error) {
        console.log(error);
      }
    
      await db.query("INSERT INTO myanilist (aniname,img,score,description) VALUES ($1, $2, $3, $4)", [aniname.toUpperCase(), img, MAL_score, desc]);

     

    } catch (error) {
      console.log(error);
    }
     res.redirect("/");
})

app.post("/edit", async (req, res) => {
  const item = req.body.updatedItemTitle;
  const id = req.body.updatedItemId;

  try {
    await db.query("UPDATE myanilist SET description = ($1) WHERE id = $2", [item, id]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.post("/delete", async(req, res)=>{
  const itemid = req.body.DeleteId;
  try {
    await db.query("DELETE FROM myanilist WHERE id = $1", [itemid]);  
  } catch (error) {
    console.log(error);
  }

  res.redirect("/")
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})
