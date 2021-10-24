const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const Joi = require("joi");
const db = require("./db");
const collection = "todo";

const schema = Joi.object().keys({
  todo: Joi.string().required(),
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/getTodos", (req, res) => {
  db.getDB()
    .collection(collection)
    .find({})
    .toArray((err, documents) => {
      if (err) console.log(err);
      else {
        console.log(documents);
        res.json(documents);
      }
    });
});
app.delete("/:id", (req, res) => {
  const todoID = req.params.id;

  db.getDB()
    .collection(collection)
    .findOneAndDelete({ _id: db.getPrimaryKey(todoID) }, (err, result) => {
      if (err) console.log(err);
      else res.json(result);
    });
});
app.post("/", async (req, res, next) => {
  const userInput = req.body;
  try {
    await schema.validateAsync(userInput);
    db.getDB()
      .collection(collection)
      .insertOne(userInput, (err, result) => {
        if (err) {
          const error = new Error("Failed to insert ToDo Document");
          error.status = 400;
          next(error);
        } else {
          db.getDB()
            .collection(collection)
            .findOne(
              { _id: db.getPrimaryKey(result.insertedId) },
              (err, result2) => {
                if (err) {
                  const error = new Error("Failed to insert ToDo Document");
                  error.status = 400;
                  next(error);
                } else {
                  console.log("Todo: ", result2);
                  res.json({
                    result: result,
                    document: result2,
                    msg: "Successfully inserted!!!",
                    error: null,
                  });
                }
              }
            );
        }
      });
  } catch (err) {
    const error = new Error("Invalid Input");
    console.log("Validation error");
    error.status = 400;
    next(error);
  }
});
app.put("/:id", async (req, res, next) => {
  const todoID = req.params.id;
  const userInput = req.body;
  try {
    await schema.validateAsync(userInput);
    db.getDB()
      .collection(collection)
      .findOneAndUpdate(
        { _id: db.getPrimaryKey(todoID) },
        { $set: { todo: userInput.todo } },
        { returnDocument: "after", returnOriginal: false },
        (err, result) => {
          if (err) {
            const error = new Error("An error occured while updating");
            error.status = 400;
            next(error);
          } else {
            res.json({
              result: result,
              msg: "Successfully updated!!!",
              error: null,
            });
          }
        }
      );
  } catch (err) {
    const error = new Error("Invalid Input");
    console.log("Validation error");
    error.status = 400;
    next(error);
  }
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.log("Error middleware : ", status);
  res.status(status).json({
    error: {
      message: err.message,
    },
  });
});
db.connect((err) => {
  if (err) {
    console.log("unable to connect to the database");
    process.exit(1);
  } else {
    app.listen(3000, () => {
      console.log("Server listens on port 3000...");
    });
  }
});
