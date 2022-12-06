const { EJSON, ObjectID } = require('bson');
const express = require('express');
const app = express();
app.use(express.static('public'));
app.use(express.json());
const cors = require("cors");
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions));

app.listen(3000, function () {
    console.log('Listening on port 3000');
})

const MongoClient = require('mongodb').MongoClient;
const db_name = 'wpr-quiz';
const db_url = 'mongodb://localhost:27017/' + db_name;

let db;
async function startServer() {
    db = await (await MongoClient.connect(db_url)).db();

    //Read from file .json
    // const fs = require('fs');
    // const data = fs.readFileSync('questions.json');
    // questions = JSON.parse(data);
    // for (let i = 0; i < questions.length; i++) {
    //     await collection.insertOne({
    //         answers: questions[i].answers, text: questions[i].text,
    //         correctAnswer: questions[i].correctAnswer
    //     });
    // }
   
}
startServer();
app.post('/attempts', async (req, res) => {
    const attempt = new Object;
    const collection = db.collection('questions');
    const questionsFromDb = await collection.aggregate([{
        $sample: {
            size: 10
        }
    }, {
        $group: {
            _id: "$_id",
            result: { $push: "$$ROOT" }
        }
    }
        , {
        $replaceRoot: {
            newRoot: { $first: "$result" }
        }
    }]).toArray();

    const questionInAttempts = new Array;

    const correctAnswers = new Object;
    for (let i = 0; i < 10; i++) {
        const questionInAttempt = new Object;
        questionInAttempt._id = questionsFromDb[i]._id;
        questionInAttempt.text = questionsFromDb[i].text;
        questionInAttempt.answers = questionsFromDb[i].answers;
        questionInAttempts[i] = questionInAttempt;
        correctAnswers[[questionsFromDb[i]._id]] = EJSON.deserialize(questionsFromDb[i].correctAnswer);
    }
    attempt.questions = questionInAttempts;
    attempt.correctAnswers = correctAnswers;
    attempt.startedAt = new Date();
    attempt.completed = false;
    attempt.scoreText = null;
    attempt.userAnswers = null;
    attempt.score = 0;
    collectionAttempt = db.collection("attempts");
    collectionAttempt.insertOne(attempt);
    res.status(201);
    const response = new Object;
    response._id = attempt._id;
    response.questions = attempt.questions;
    response.startedAt = attempt.startedAt;
    response.score = attempt.score;
    response.completed = attempt.completed;
    res.json(response);
});

app.post('/attempts/:id/submit', async function (req, res) {
    const attemptID = req.params.id;
    const collection = db.collection("attempts");
    const response = new Object;
    const userAnswers = req.body.userAnswers;
    let score = 0;
    let scoreText;
    const result = await collection.findOne({ _id: ObjectID(attemptID) });

    if (result !== null) {
        const correctAnswers = result.correctAnswers;
        const userAnswerIDs = Object.keys(userAnswers);
        const correctAnswerIDs = Object.keys(correctAnswers);
        for (let i = 0; i < userAnswerIDs.length; i++) {
            if (correctAnswerIDs.includes(userAnswerIDs[i])) {
                const correctAnswer = correctAnswers[userAnswerIDs[i]];
                if (userAnswers[userAnswerIDs[i]] == correctAnswer) {
                    score = score + 1;
                }
            }
        }
        if (score < 5) {
            scoreText = "Practice more to improve it :D";
        } else if (score < 7) {
            scoreText = "Good, keep up!";
        } else if (score < 9) {
            scoreText = "Well done!";
        } else {
            scoreText = "Perfect!!";
        }

        if (result.completed !== true) {
            response._id = attemptID;
            response.questions = result.questions;
            response.correctAnswers = EJSON.deserialize(correctAnswers);
            response.startedAt = result.startedAt;
            response.score = score;

            response.scoreText = scoreText;
            response.userAnswers = userAnswers;
            response.completed = true;
            collection.updateOne({ _id: ObjectID(attemptID) }, {
                $set: {
                    score: score, scoreText: scoreText,
                    completed: true, userAnswers: userAnswers
                }
            });
            res.status(200);
            res.json(response);
        }
    }
});


