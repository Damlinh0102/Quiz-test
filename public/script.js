// TODO(you): Write the JavaScript necessary to complete the assignment.
const start_button = document.querySelector("#btn-start");
const submit_button = document.querySelector("#btn-submit");
const review_button = document.querySelector("#btn-try-again");
const header = document.querySelector("header");
const introduction = document.querySelector("#introduction");
const attemptQuiz = document.querySelector("#attempt-quiz");
const reviewQuiz = document.querySelector("#review-quiz");
const questionsDiv = document.querySelector(".questions");
const reviewQuestions = document.querySelector(".reviewQues");
const boxResult = document.querySelector("#box-result");
const score = document.querySelector(".score");
const percent = document.querySelector(".percent");
const message = document.querySelector(".message");
let object = new Object;

attemptQuiz.classList.add("hidden");
reviewQuiz.classList.add("hidden");

function createAQuestion(questioni, i, questionsDiv) {
    const answerArray = questioni.answers;
    const questionIndex = document.createElement('h2');
    questionIndex.textContent = "Question " + (i + 1) + " of 10";
    questionIndex.classList.add("question-index");
    const questionText = document.createElement("div");
    questionText.textContent = questioni.text;
    const optionList = document.createElement("div");
    optionList.classList.add("option-list");

    questionsDiv.appendChild(questionIndex);
    questionsDiv.appendChild(questionText);
    questionsDiv.appendChild(optionList);
    for (let j = 0; j < answerArray.length; j++) {
        const optionLabel = document.createElement("label");
        optionLabel.classList.add("option");
        optionLabel.textContent = answerArray[j];
        optionList.appendChild(optionLabel);
        const optionInput = document.createElement("input");
        optionInput.type = 'radio';
        optionInput.value = j;
        optionInput.name = i;
        optionLabel.appendChild(optionInput);
    }
}
function onDisplayAttempt(json) {
    object.attemptID = json._id;
    object.questions = json.questions;
    const arrayOfQuestions = json.questions;
    for (let i = 0; i < arrayOfQuestions.length; i++) {
        const questioni = arrayOfQuestions[i];
        createAQuestion(questioni, i, questionsDiv);
    }
    const options = questionsDiv.querySelectorAll(".option");
    for (let option of options) {
        option.addEventListener("click", choose);
    }
}
function onJson(json) {
    onDisplayAttempt(json);
}
function onResponse(response) {
    if (response.status === 404) {
        location.replace('https://wpr-quiz-api.herokuapp.com/404.html');
    }
    console.log(response.status);
    return response.json();
}
function start() {
    introduction.classList.add("hidden");
    attemptQuiz.classList.remove("hidden");
    header.scrollIntoView();
    fetch('https://wpr-quiz-api.herokuapp.com/attempts', { method: 'POST' }).then(onResponse).then(onJson);
}
function choose(event) {
    const option_select = event.currentTarget;
    const option_selecteds = questionsDiv.querySelectorAll(".option-selected");
    for (const option_selected of option_selecteds) {
        if (option_selected) {
            if (option_selected.childNodes[1].name === option_select.childNodes[1].name) {
                option_selected.classList.remove("option-selected");
                option_selected.checked = false;
            }
        }
    }
    option_select.classList.add("option-selected");
    option_select.checked = true;
}

function postData(data) {
    const url = "https://wpr-quiz-api.herokuapp.com/attempts/"+ object.attemptID +"/submit";
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(onResponse).then(onDisplayReview);
}
function onDisplayReview(json) {
    const arrayOfQuestions = json.questions;
    const correctAnswers = json.correctAnswers;
    const yourAnswers = json.userAnswers;
   
    for (let i = 0; i < arrayOfQuestions.length; i++) {
        const questioni = arrayOfQuestions[i];
        createAQuestion(questioni, i, reviewQuestions);
    }
    const options = reviewQuestions.querySelectorAll(".option");
    let before = 0;
    for (let i = 0; i < arrayOfQuestions.length; i++) {
        const questioni = arrayOfQuestions[i];
        if(typeof (yourAnswers[questioni._id]) !== 'undefined') {
            if(Number(yourAnswers[questioni._id]) === Number(correctAnswers[questioni._id])) {
                for(j = 0; j < questioni.answers.length; j++) {
                    const option = options[before+j];
                    if(Number(option.childNodes[1].value) === Number(yourAnswers[questioni._id])) {
                        option.classList.add("correct-answer");
                        option.childNodes[1].checked = true;
                        const labelCorrectAnswer = document.createElement("label");
                        labelCorrectAnswer.textContent = "Correct answer";
                        option.appendChild(labelCorrectAnswer);
                    }
                }
            } else {
                for(j = 0; j < questioni.answers.length; j++) {
                    const option = options[before+j];
                    if(Number(option.childNodes[1].value) === Number(yourAnswers[questioni._id])) {
                        option.classList.add("wrong-answer");
                        option.childNodes[1].checked = true;
                        const labelYourAnswer = document.createElement("label");
                        labelYourAnswer.textContent = "Your answer";
                        option.appendChild(labelYourAnswer);
                    } else if(Number(option.childNodes[1].value) === Number(correctAnswers[questioni._id])) {
                        option.classList.add("option-correct");
                        const labelWrongAnswer = document.createElement("label");
                        labelWrongAnswer.textContent = "Correct answer";
                        option.appendChild(labelWrongAnswer);
                    }
                }
            }
        }
        before = before + questioni.answers.length;
    }
    const questionsInReview = reviewQuestions.querySelectorAll(".option");
    for(let option of questionsInReview) {
        option.childNodes[1].disabled = true;
    }
    score.textContent = Number(json.score) +"/"+ arrayOfQuestions.length;
    percent.textContent = Number(json.score) / arrayOfQuestions.length * 100 + "%";
    message.textContent = json.scoreText;
    console.log(json);
}

function submit() {
    attemptQuiz.classList.add("hidden");
    reviewQuiz.classList.remove("hidden");
    confirm("You sure want to finish this quiz?");
    const userAnswers = {};
    const answers = {};
    const questions = object.questions;
    const option_selecteds = attemptQuiz.querySelectorAll(".option-selected");
    for (const option_selected of option_selecteds) {
        const question = questions[option_selected.childNodes[1].name];
        const questionID = question._id;
        userAnswers[questionID] = option_selected.childNodes[1].value;
    }
    answers.userAnswers = userAnswers;
    postData(answers);
    header.scrollIntoView();
}
function review() {
    reviewQuiz.classList.add("hidden");
    introduction.classList.remove("hidden");
    location.reload();
    header.scrollIntoView();
}

start_button.addEventListener("click", start);
submit_button.addEventListener("click", submit);
review_button.addEventListener("click", review);

