import View from './view';
import State from './state';
import Sound from './sound';
import QuestionManager from './question';
import { apiManager } from './apiManager';
import state from './state';

export default {
  fallingId: 0,
  refallingId: 0,
  questionType: null,
  randomQuestion: null,
  question: '',
  score: 0,
  time: 0,
  remainingTime: 0,
  fallingSpeed: 0,
  optionSize: 0,
  fallingOption: null,
  timer: null,
  timerRunning: false,
  nextQuestion: true,
  randomPair: [],
  fallingItems: [],
  reFallingItems: [],
  typedItems: [],
  randomQuestionId: 0,
  answeredNum: 0,
  correctedAnswerNumber: 0,
  answerLength: 0,
  questionWrapper: null,
  answerWrapper: null,
  fillwordTime: 0,
  redBoxX: 0,
  redBoxY: 0,
  redBoxWidth: 0,
  redBoxHeight: 0,
  leftCount: 0,
  rightCount: 0,
  fallingDelay: 0,
  finishedCreateOptions: false,
  eachQAMark: 0,
  isPlayLastTen: false,
  isTriggeredBackSpace: false,
  selectedCount: 0,
  columnWidth: 0,
  numberOfColumns: 4,
  wholeScreenColumnSeperated: false,
  starNum: 0,
  touchBtn: false,
  apiManager: null,

  init(gameTime = null, fallSpeed = null) {
    //View.showTips('tipsReady');
    this.startedGame = false;
    this.fallingId = 0;
    this.remainingTime = gameTime !== null ? gameTime : 300;
    this.fallingSpeed = fallSpeed !== null ? fallSpeed : 8;
    this.fallingDelay = this.fallingSpeed * 250;
    this.updateTimerDisplay(this.remainingTime);
    this.questionType = QuestionManager.questionField;
    this.randomQuestion = null;
    this.question = '';
    this.score = 0;
    this.time = 0;
    this.timerRunning = false;
    this.nextQuestion = true;
    this.addScore(0);
    this.randomPair = [];
    this.fallingItems = [];
    this.reFallingItems = [];
    this.refallingId = 0;
    this.typedItems = [];
    this.stopCountTime();
    this.fillwordTime = 0;
    this.questionWrapper = null;
    this.answerWrapper = null;
    View.scoreBoard.className = "scoreBoard";
    this.randomQuestionId = 0;
    this.answeredNum = 0;
    this.correctedAnswerNumber = 0;
    this.answerLength = 0;
    this.optionSize = View.canvas.width / 7.5;
    this.redBoxX = View.canvas.width / 3;
    this.redBoxY = (View.canvas.height / 5) * 3;
    this.redBoxWidth = View.canvas.width / 3;
    this.redBoxHeight = (View.canvas.height / 5) * 2;
    this.leftCount = 0;
    this.rightCount = 0;
    View.stageImg.innerHTML = '';
    View.optionArea.innerHTML = '';
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    this.finishedCreateOptions = false;
    this.eachQAMark = 10;
    View.hideSuccess();
    View.hideFailure();
    for (let i = 1; i < 4; i++) {
      let star = document.getElementById("star" + i);
      if (star) {
        star.classList.remove("show");
      }
    }
    this.isPlayLastTen = false;
    this.isTriggeredBackSpace = false;
    this.starNum = 0;
    this.selectedCount = 0;
    this.touchBtn = false;
    this.apiManager = state.apiManager;
  },

  handleVisibilityChange() {
    if (State.state === 'playing') {
      if (document.hidden) {
        this.pauseGame();
      } else {
        this.resumeGame();
      }
    }
  },

  pauseGame() {
    if (this.timerRunning && this.startedGame) {
      clearTimeout(this.timer);
      cancelAnimationFrame(this.fallingOption);
      this.timerRunning = false;
      this.showQuestions(false);
      this.isPlayLastTen = false;
      if (State.isSoundOn) Sound.stopAll(['bgm']);
    }
  },

  resumeGame() {
    if (this.startedGame && !this.timerRunning) {
      this.showQuestions(true);
      this.timerRunning = true;
      this.countTime();
      this.startFalling();
    }
  },

  addScore(mark) {
    let currentScore = this.score;
    let newScore = this.score + mark;

    if (newScore < 0)
      newScore = 0;

    if (newScore >= 30 && newScore < 60) {
      this.starNum = 1;
      View.showSuccess();
    }
    else if (newScore >= 60 && newScore <= 90) {
      this.starNum = 2;
    }
    else if (newScore > 90) {
      this.starNum = 3;
    }
    else {
      View.showFailure();
    }

    this.score = newScore;
    //View.scoreText.innerText = this.score;
    this.countUp(View.scoreText, currentScore, this.score, 1000);
  },

  countUp(displayElement, start, end, duration) {
    let startTime = null;
    let lastSoundTime = 0;
    const soundInterval = 200;

    function animate(timestamp) {
      if (!startTime) {
        startTime = timestamp;
        displayElement.style.color = 'yellow';
      }
      const progress = timestamp - startTime;
      // Calculate the current value based on the start value
      const current = Math.min(Math.floor((progress / duration) * (end - start) + start), end);
      displayElement.innerText = current;

      if (current < end) {
        if (State.isSoundOn && (timestamp - lastSoundTime >= soundInterval)) {
          Sound.play('score');
          lastSoundTime = timestamp; // Update the last sound time
        }
        requestAnimationFrame(animate);
      }
      else {
        displayElement.style.color = 'white';
      }
    }
    requestAnimationFrame(animate);
  },

  showFinalStars() {
    const delayPerStar = 200;
    const star1 = document.getElementById("star1");
    const star2 = document.getElementById("star2");
    const star3 = document.getElementById("star3");

    if (this.starNum === 1) {
      star1.classList.add('show');
      this.scaleStarUp(star1, 500);
    }
    else if (this.starNum === 2) {
      star1.classList.add('show');
      this.scaleStarUp(star1, 500, () => {
        setTimeout(() => {
          star2.classList.add('show');
          this.scaleStarUp(star2, 500);
        }, delayPerStar);
      });
    }
    else if (this.starNum === 3) {
      star1.classList.add('show');
      this.scaleStarUp(star1, 500, () => {
        setTimeout(() => {
          star2.classList.add('show');
          this.scaleStarUp(star2, 500, () => {
            setTimeout(() => {
              star3.classList.add('show');
              this.scaleStarUp(star3, 500);
            }, delayPerStar);
          });
        }, delayPerStar);
      });
    }
  },

  scaleStarUp(starElement, duration, callback = null) {
    let start = null;
    const initialScale = 0;
    const finalScale = 1;

    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const scale = Math.min(initialScale + (progress / duration), finalScale);
      starElement.style.transform = `scale(${scale})`;
      starElement.style.opacity = scale;

      if (scale < finalScale) {
        requestAnimationFrame(animate);
      } else if (callback) {
        callback();
      }
    }

    requestAnimationFrame(animate);
  },

  startCountTime() {
    if (!this.startedGame) {
      this.time = this.remainingTime;
      this.startedGame = true;
    }

    if (!this.timerRunning) {
      this.showQuestions(true);
      this.timerRunning = true;
      this.finishedCreateOptions = false;
      this.countTime();
      this.startFalling();
    }
  },

  startFalling() {
    let firstFall = true;
    const falling = (timestamp) => {
      if (!this.lastFallingTime) this.lastFallingTime = timestamp;
      const elapsed = timestamp - this.lastFallingTime;
      let currentDelay = firstFall ? 500 : this.fallingDelay;
      //console.log(this.finishedCreateOptions);
      if (elapsed >= currentDelay) {
        if (!this.finishedCreateOptions && this.randomPair.length > 0) {
          if (this.fallingItems.length < this.randomPair.length) {
            if (this.fallingId < this.fallingItems.length) {
              console.log("falling id:", this.fallingId);
              this.fallingId += 1;
            } else {
              this.fallingId = 0;
            }
            var optionImageId = this.fallingId % View.preloadedFallingImages.length;
            this.createRandomItem(
              this.randomPair[this.fallingId],
              View.preloadedFallingImages.length === 0 ? null : View.preloadedFallingImages[optionImageId],
              View.preloadedLeftSubImages.length === 0 ? null : View.preloadedLeftSubImages[optionImageId],
              View.preloadedRightSubImages.length === 0 ? null : View.preloadedRightSubImages[optionImageId],
            );
          }
          else {
            this.finishedCreateOptions = true;
            console.log("finished created all");
          }
        }
        else {
          if (this.reFallingItems.length > 0) {
            let refallingItem = this.reFallingItems[0];
            this.resetFallingItem(refallingItem);
            this.reFallingItems.splice(0, 1);
            console.log(this.resetFallingItem);
          }
        }
        this.lastFallingTime = timestamp;
        firstFall = false;
      }

      if (this.timerRunning) {
        this.fallingOption = requestAnimationFrame(falling);
      }
    };
    this.fallingOption = requestAnimationFrame(falling);
  },

  countTime() {
    if (this.timerRunning) {
      if (this.nextQuestion) {
        this.setQuestions();
        this.nextQuestion = false;
      }
      this.time--;
      this.updateTimerDisplay(this.time);

      if (this.time <= 10 && !this.isPlayLastTen) {
        if (State.isSoundOn) {
          Sound.play('lastTen', true);
          console.log('play last ten!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        }
        View.timeText.classList.add('lastTen');
        this.isPlayLastTen = true;
      }

      if (this.time <= 0) {
        this.stopCountTime();
        View.timeText.classList.remove('lastTen');
        State.changeState('finished');
        this.startedGame = false;
      } else {
        this.timer = setTimeout(this.countTime.bind(this), 1000);
      }
    }
  },
  stopCountTime() {
    if (this.timerRunning) {
      clearInterval(this.timer);
      cancelAnimationFrame(this.fallingOption);
      this.timerRunning = false;
      this.showQuestions(false);
    }
  },
  updateTimerDisplay(countdownTime) {
    // Calculate the minutes and seconds
    const minutes = Math.floor(countdownTime / 60);
    const seconds = countdownTime % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    //console.log("count", timeString);
    View.timeText.innerText = timeString;
  },
  getTranslateYValue(transformStyle) {
    const translateYRegex = /translateY\((-?\d+\.?\d*)px\)/;
    const match = transformStyle.match(translateYRegex);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    return 0;
  },
  generateUniqueId() {
    return Math.random().toString(16).slice(2);
  },
  createRandomItem(char, optionImage, optionLeftImage, optionRightImage) {
    if (char && char.length !== 0) {
      const columnId = this.getBalancedColumn();
      const word = char;

      const generatePosition = () => {
        const x = this.generatePositionX(columnId);
        const id = this.generateUniqueId();
        const optionWrapper = this.createOptionWrapper(word, id, optionImage, optionLeftImage, optionRightImage, columnId);
        const newFallingItem = {
          x,
          size: this.optionSize,
          img: optionImage,
          optionWrapper,
          id,
        };
        return newFallingItem;
      };

      const newFallingItem = generatePosition();
      this.fallingItems.push(newFallingItem);
      this.renderFallingItem(newFallingItem);
    }
  },

  getNextSordOrder() {
    if (this.selectedCount < this.numberOfColumns - 1)
      this.selectedCount += 1;
    else
      this.selectedCount = 0;

    return this.selectedCount;
  },

  getBalancedColumn() {
    /*if (this.usedColumn.length > 0) {
      let randomId = Math.floor(Math.random() * this.randomPair.length);
      let newRandomId = this.usedColumn[randomId % this.numberOfColumns];

      let indexToRemove = this.usedColumn.indexOf(newRandomId);
      this.usedColumn.splice(indexToRemove, 1);
      return newRandomId;
    }
    else {
      //let nextOrder = this.getNextSordOrder();
      let nextOrder = Math.floor(Math.random() * 4);
      return nextOrder;
    }*/

    //let randomId = Math.floor(Math.random() * this.randomPair.length);
    //let newRandomId = randomId % this.numberOfColumns;
    let newRandomId = this.getNextSordOrder();
    console.log("new randomw id", newRandomId);
    return newRandomId;
  },

  generatePositionX(columnId) {
    if (this.wholeScreenColumnSeperated) {
      const offset = 20;
      // Calculate the X position based on the columnId
      let positionX = columnId * this.columnWidth + offset; // Center the position within the column

      if (positionX + this.columnWidth / 2 > View.canvas.width - offset) {
        positionX = View.canvas.width - offset - this.columnWidth / 2;
      }
      return positionX;
    }
    else {
      const isLeft = columnId < Math.floor(this.redBoxX / this.optionSize);
      let numColumns, columnWidth;

      if (isLeft) {
        numColumns = Math.floor(this.redBoxX / this.optionSize);
        columnWidth = this.redBoxX / numColumns;
        return columnId * columnWidth + 15;
      } else {
        numColumns = Math.floor((View.canvas.width - this.redBoxX - this.redBoxWidth - 10) / this.optionSize);
        columnWidth = (View.canvas.width - this.redBoxX - this.redBoxWidth - 10) / numColumns;
        return this.redBoxX + this.redBoxWidth + (columnId - Math.floor(this.redBoxX / this.optionSize)) * columnWidth + 30;
      }
    }
  },
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  },
  createOptionWrapper(text, id, optionImage, optionLeftImage, optionRightImage, columnId) {
    let optionWrapper = document.createElement('div');
    optionWrapper.classList.add('optionWrapper');
    optionWrapper.style.width = `${this.optionSize + 20}px`;
    optionWrapper.style.height = `${this.optionSize + 20}px`;
    if (optionImage !== '' && optionImage !== 'undefined') {
      optionWrapper.style.backgroundImage = `url(${optionImage.src})`;
      optionWrapper.style.backgroundSize = 'contain'; // Adjust size to maintain aspect ratio
      optionWrapper.style.backgroundRepeat = 'no-repeat'; // Prevent repeating
      optionWrapper.style.backgroundPosition = 'center'; // Center the image
    }
    optionWrapper.id = id;
    optionWrapper.setAttribute('word', text);
    optionWrapper.setAttribute('column', columnId);
    let option = document.createElement('span');
    option.classList.add('option');
    option.textContent = text;
    /*let fontSize = `calc(min(max(4vh, 20vh - ${text.length} * 5.2vh), 8vh))`;
    option.style.setProperty('--font-size', fontSize);*/
    let containerWidth = this.optionSize;
    let maxFontSize = 60; // Maximum font size in px
    let minFontSize = 10; // Minimum font size in px
    let fontSize = Math.max(minFontSize, Math.min(maxFontSize, containerWidth / (text.length * 0.65)));

    option.style.fontSize = `${fontSize}px`;

    const leftSubImage = document.createElement('div');
    const rightSubImage = document.createElement('div');
    if (optionLeftImage === null || optionRightImage === null) {
      leftSubImage.classList.add('sub-image', 'left', 'cutLeft');
      leftSubImage.style.backgroundImage = `url(${optionImage.src})`;
      rightSubImage.classList.add('sub-image', 'right', 'cutRight');
      rightSubImage.style.backgroundImage = `url(${optionImage.src})`;
    }
    else {
      leftSubImage.classList.add('sub-image', 'left');
      leftSubImage.style.backgroundImage = `url(${optionLeftImage.src})`;
      rightSubImage.classList.add('sub-image', 'right');
      rightSubImage.style.backgroundImage = `url(${optionRightImage.src})`;
    }
    leftSubImage.style.backgroundSize = 'contain'; // Adjust size to maintain aspect ratio
    leftSubImage.style.backgroundRepeat = 'no-repeat'; // Prevent repeating
    leftSubImage.style.backgroundPosition = 'center'; // Center the image
    rightSubImage.style.backgroundSize = 'contain'; // Adjust size to maintain aspect ratio
    rightSubImage.style.backgroundRepeat = 'no-repeat'; // Prevent repeating
    rightSubImage.style.backgroundPosition = 'center'; // Center the image
    option.append(leftSubImage);
    option.append(rightSubImage);
    optionWrapper.appendChild(option);
    optionWrapper.setAttribute('image', optionImage.src);
    optionWrapper.setAttribute('fontSize', fontSize);
    optionWrapper.setAttribute('loop', 'true');
    return optionWrapper;
  },
  getRandomQuestions(string) {
    const randomIndex = Math.floor(Math.random() * string.length);
    return string[randomIndex];
  },
  renderFallingItem(item) {
    View.optionArea.appendChild(item.optionWrapper);
    item.optionWrapper.classList.add("show");
    item.optionWrapper.style.left = item.x + 'px';
    item.optionWrapper.style.setProperty('--bottom-height', `${(View.canvas.height + this.optionSize + 100)}px`);
    item.optionWrapper.style.setProperty('--fallingSpeed', `${this.fallingSpeed}s`);
    item.optionWrapper.addEventListener('animationend', () => this.animationEnd(item.optionWrapper));
  },

  animationEnd(optionWrapper) {
    var loop = optionWrapper.getAttribute('loop');
    if (loop === 'true') {
      console.log("loop", loop);
      this.reFallingItems.push(optionWrapper);
      //console.log("re falling item////////////////////////////////////////////////////////////////////////", optionWrapper.getAttribute("word"));
    }
  },

  resetFallingItem(optionWrapper) {
    optionWrapper.classList.remove('show');
    const retrievedLeftSubImage = optionWrapper.querySelector('.sub-image.left');
    const retrievedRightSubImage = optionWrapper.querySelector('.sub-image.right');
    retrievedLeftSubImage.classList.remove('slice-left');
    retrievedRightSubImage.classList.remove('slice-right');
    if (this.nextQuestion || State.stateType === 'ansWrong')
      return;

    let currentColumnId = parseInt(optionWrapper.getAttribute('column'));
    if (currentColumnId < this.numberOfColumns - 1) {
      currentColumnId += 1;
    }
    else {
      currentColumnId = 0;
    }
    optionWrapper.x = this.generatePositionX(currentColumnId);
    optionWrapper.setAttribute('column', currentColumnId);
    //let delay = this.refallingDelay();
    //console.log("delay", delay, itemLength);
    setTimeout(() => {
      optionWrapper.style.left = optionWrapper.x + 'px';
      optionWrapper.style.setProperty('--bottom-height', `${View.canvas.height + this.optionSize + 100}px`);
      optionWrapper.style.setProperty('--fallingSpeed', `${this.fallingSpeed}s`);
      optionWrapper.classList.add('show');
    }, 100);
  },

  refallingDelay() {
    let itemLength;

    if (this.finishedCreateOptions) {
      itemLength = this.fallingItems.length - 1;
    }
    else {
      itemLength = this.randomPair.length;
    }
    let delay = 0;

    if (itemLength > 1) {
      delay = itemLength * 280;
    }
    return delay;
  },

  removeFallingItem(item) {
    const index = this.fallingItems.findIndex(i => i.optionWrapper === item);
    if (index !== -1) {
      this.fallingItems.splice(index, 1);
      View.optionArea.removeChild(item);
    }
  },
  removeFallingItemByIndex(id) {
    const item = this.fallingItems.find(item => item.id === id);
    if (item) {
      const index = this.fallingItems.indexOf(item);
      this.fallingItems.splice(index, 1);
      View.optionArea.removeChild(item.optionWrapper);
    }
  },
  /////////////////////////////////////////Random Questions///////////////////////////////
  randQuestion() {
    if (this.questionType === null || this.questionType === undefined)
      return null;

    let questions = this.questionType.questions;
    if (this.randomQuestionId === 0) {
      questions = questions.sort(() => Math.random() - 0.5);
    }
    console.log("questions", questions);
    const _type = questions[this.randomQuestionId].questionType;
    const _QID = questions[this.randomQuestionId].qid;
    const _question = questions[this.randomQuestionId].question;
    const _answers = questions[this.randomQuestionId].answers;
    const _correctAnswer = questions[this.randomQuestionId].correctAnswer;
    const _star = questions[this.randomQuestionId].star;
    const _score = questions[this.randomQuestionId].score;
    const _correctAnswerIndex = questions[this.randomQuestionId].correctAnswerIndex;
    const _media = questions[this.randomQuestionId].media;

    if (this.randomQuestionId < questions.length - 1) {
      this.randomQuestionId += 1;
    }
    else {
      this.randomQuestionId = 0;
    }

    if (this.answeredNum < questions.length) {
      this.answeredNum += 1;
    }

    //console.log("answered count", this.answeredNum);
    return {
      QuestionType: _type,
      QID: _QID,
      Question: _question,
      Answers: _answers,
      CorrectAnswer: _correctAnswer,
      Star: _star,
      Score: _score,
      CorrectAnswer: _correctAnswer,
      CorrectAnswerId: _correctAnswerIndex,
      Media: _media,
    };
  },
  generateCharArray(word) {
    var chars = word.split('');
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars;
  },
  randomizeAnswers(array) {
    if (!Array.isArray(array) || array.length === 0) {
      return [];
    }
    return array.slice().sort(() => Math.random() - 0.5);
  },

  randomOptions() {
    //console.log('question class', this.randomQuestion);
    if (this.randomQuestion.Answers && this.randomQuestion.Answers.length > 0) {
      this.answerLength = 1;
      return this.randomizeAnswers(this.randomQuestion.Answers);
    }
    else {
      var array = this.generateCharArray(this.randomQuestion.CorrectAnswer);
      this.answerLength = array.length;
      return array;
    }
  },
  setQuestions() {
    this.randomQuestion = this.randQuestion();
    console.log(this.randomQuestion);
    if (this.randomQuestion === null)
      return;

    this.question = this.randomQuestion.Question;
    this.randomPair = this.randomOptions();
    this.selectedCount = Math.floor(Math.random() * this.numberOfColumns);
    this.questionWrapper = document.createElement('div');
    let questionBg = document.createElement('div');
    this.answerWrapper = document.createElement('span');

    switch (this.randomQuestion.QuestionType) {
      case 'spelling':
        this.questionWrapper.classList.add('questionWrapper');
        questionBg.classList.add('questionBg');
        View.stageImg.appendChild(questionBg);

        var questionText = document.createElement('span');
        questionText.textContent = this.randomQuestion.Question;
        this.questionWrapper.appendChild(questionText);
        var fontSize = `calc(min(max(3vh, 6vh - ${this.randomQuestion.Question.length} * 0.1vh), 6vh))`;
        this.questionWrapper.style.setProperty('--question-font-size', fontSize);
        this.answerWrapper.classList.add('textType');
        //View.stageImg.appendChild(questionText);
        break;
      case 'text':
        this.questionWrapper.classList.add('questionAudioWrapper');
        questionBg.classList.add('questionAudioBg');
        View.stageImg.appendChild(questionBg);
        var questionText = document.createElement('span');
        questionText.textContent = this.randomQuestion.Question;
        this.questionWrapper.appendChild(questionText);
        var fontSize = `calc(min(max(3vh, 6vh - ${this.randomQuestion.Question.length} * 0.1vh), 6vh))`;
        this.questionWrapper.style.setProperty('--question-font-size', fontSize);
        this.questionWrapper.style.top = "-15%";
        this.answerWrapper.classList.add('audioType');
        break;
      case 'audio':
        this.questionWrapper.classList.add('questionAudioWrapper');
        questionBg.classList.add('questionAudioBg');
        View.stageImg.appendChild(questionBg);
        this.buttonWrapper = document.createElement('button');
        this.buttonWrapper.classList.add('buttonWrapper');
        this.buttonWrapper.classList.add('audioPlay');
        this.buttonWrapper.addEventListener('mousedown', () => {
          this.buttonWrapper.classList.add('clicked');
          this.buttonWrapper.classList.remove('not-clicked');
          this.playWordAudio(this.randomQuestion.QID);
        });

        this.buttonWrapper.addEventListener('mouseup', () => {
          this.buttonWrapper.classList.remove('clicked');
          this.buttonWrapper.classList.add('not-clicked');
        });
        this.buttonWrapper.addEventListener('touchstart', (event) => {
          event.preventDefault(); // Prevent default touch behavior
          this.buttonWrapper.classList.add('clicked');
          this.buttonWrapper.classList.remove('not-clicked');
          this.playWordAudio(this.randomQuestion.QID);
        });

        this.buttonWrapper.addEventListener('touchend', (event) => {
          event.preventDefault(); // Prevent default touch behavior
          this.buttonWrapper.classList.remove('clicked');
          this.buttonWrapper.classList.add('not-clicked');
        });
        this.questionWrapper.appendChild(this.buttonWrapper);
        this.answerWrapper.classList.add('audioType');
        break;
      case 'fillInBlank':
      case 'reorder':
        this.questionWrapper.classList.add('questionFillBlankWrapper');
        questionBg.classList.add('questionImgBg');
        View.stageImg.appendChild(questionBg);
        var questionText = document.createElement('span');
        questionText.textContent = this.randomQuestion.Question;
        this.questionWrapper.appendChild(questionText);
        var fontSize = `calc(min(max(3vh, 6vh - ${this.randomQuestion.Question.length} * 0.1vh), 6vh))`;
        this.questionWrapper.style.setProperty('--question-font-size', fontSize);

        this.buttonWrapper = document.createElement('button');
        this.buttonWrapper.classList.add('buttonWrapper');
        this.buttonWrapper.classList.add('fillBlankPlay');
        this.buttonWrapper.addEventListener('mousedown', () => {
          this.touchBtn = true;
          this.buttonWrapper.classList.add('clicked');
          this.buttonWrapper.classList.remove('not-clicked');
          this.playWordAudio(this.randomQuestion.QID);
        });

        this.buttonWrapper.addEventListener('mouseup', () => {
          this.touchBtn = false;
          this.buttonWrapper.classList.remove('clicked');
          this.buttonWrapper.classList.add('not-clicked');
        });
        this.buttonWrapper.addEventListener('touchstart', (event) => {
          event.preventDefault(); // Prevent default touch behavior
          this.touchBtn = true;
          this.buttonWrapper.classList.add('clicked');
          this.buttonWrapper.classList.remove('not-clicked');
          this.playWordAudio(this.randomQuestion.QID);
        });

        this.buttonWrapper.addEventListener('touchend', (event) => {
          event.preventDefault(); // Prevent default touch behavior
          this.touchBtn = false;
          this.buttonWrapper.classList.remove('clicked');
          this.buttonWrapper.classList.add('not-clicked');
        });
        this.questionWrapper.appendChild(this.buttonWrapper);

        this.answerWrapper.classList.add('pictureType');
        break;
      case 'picture':
        this.questionWrapper.classList.add('questionImageWrapper');
        questionBg.classList.add('questionImgBg');
        View.stageImg.appendChild(questionBg);

        if (QuestionManager.preloadedImagesItem && QuestionManager.preloadedImagesItem.length > 0) {
          //let imageFile = imageFiles.find(([name]) => name === this.questionWord.QID);
          let currentImagePath = '';
          let imageFile = null;
          QuestionManager.preloadedImagesItem.forEach((img) => {
            if (img.id === this.randomQuestion.QID) {
              imageFile = img.src;
              //console.log("imageFile", imageFile);
            }
          });

          if (imageFile) {
            currentImagePath = imageFile;
            var imageElement = document.createElement('img');
            imageElement.src = currentImagePath;
            imageElement.alt = 'image';
            imageElement.classList.add('questionImage');
            this.questionWrapper.appendChild(imageElement);
          }
        }
        this.answerWrapper.classList.add('pictureType');
        break;
    }

    console.log("this.randomQuestion.Answers", this.randomQuestion.Answers);
    if (this.randomQuestion.Answers === undefined) {
      let resetBtn = document.createElement('div');
      let resetTouchBtn = document.createElement('button');
      resetTouchBtn.classList.add('resetBtn');

      switch (this.randomQuestion.QuestionType) {
        case 'spelling':
          resetTouchBtn.classList.add('resetTextType');
          break;
        case 'audio':
          resetTouchBtn.classList.add('resetAudioType');
          break;
        case 'fillInBlank':
        case 'reorder':
        case 'picture':
          resetTouchBtn.classList.add('resetPictureType');
          break;
      }

      resetTouchBtn.addEventListener('mousedown', () => {
        this.touchBtn = true;
        this.backSpaceWord(resetTouchBtn);
      });

      resetTouchBtn.addEventListener('mouseup', () => {
        this.touchBtn = false;
        resetTouchBtn.classList.remove('active');
      });
      resetTouchBtn.addEventListener('touchstart', (event) => {
        event.preventDefault(); // Prevent default touch behavior
        this.touchBtn = true;
        this.backSpaceWord(resetTouchBtn);
      });

      resetTouchBtn.addEventListener('touchend', (event) => {
        event.preventDefault(); // Prevent default touch behavior
        this.touchBtn = false;
        resetTouchBtn.classList.remove('active');
      });

      resetBtn.appendChild(resetTouchBtn)
      View.stageImg.appendChild(resetBtn);
    }

    if (this.randomQuestion.QID && this.randomQuestion.QID.trim() !== '') {
      this.playWordAudio(this.randomQuestion.QID);
      console.log('audio', this.randomQuestion.QID);
    }

    this.answerWrapper.classList.add('answerWrapper');
    View.stageImg.appendChild(this.questionWrapper);
    View.stageImg.appendChild(this.answerWrapper);
    View.stageImg.classList.add('fadeIn');
    View.stageImg.style.opacity = 1;
  },

  motionTriggerPlayAudio(_play) {
    if (_play) {
      this.buttonWrapper.classList.add('clicked');
      this.buttonWrapper.classList.remove('not-clicked');
      this.playWordAudio(this.randomQuestion.QID);
    }
    else {

      setTimeout(() => {
        this.buttonWrapper.classList.add('not-clicked');
        this.buttonWrapper.classList.remove('clicked');
      }, 250);
    }
  },

  playWordAudio(QID) {
    // Add your button click event handler logic here
    if (State.isSoundOn) {
      Sound.stopAll(['bgm', 'lastTen']);
      Sound.play(QID);
    }
  },

  showQuestions(status) {
    View.stageImg.style.opacity = status ? '1' : '0';
    View.optionArea.style.opacity = status ? '1' : '0';
    if (!status) {
      this.finishedCreateOptions = false;
      this.fallingItems.splice(0);
      this.reFallingItems.splice(0);
      View.optionArea.innerHTML = '';
      this.fallingId = 0;
      console.log("::::::::::::::::::::::::::::", this.typedItems);
    }
  },
  finishedGame() {
    this.question = '';
    this.fallingItems.splice(0);
    View.stageImg.innerHTML = '';
    View.optionArea.innerHTML = '';
  },
  fillWord(option) {
    if (this.answerWrapper) {
      if (this.fillwordTime < this.answerLength) {
        this.answerWrapper.textContent += option.getAttribute('word');

        if (this.questionType.QuestionType === "Text") {
          if (View.optionArea.contains(option)) {
            this.resetFallingItem(option);
          }
        }
        else {
          console.log("deduct:", option);
          this.typedItems.push(option);
          this.playSlicedEffect(option);
        }
        this.fillwordTime += 1;
        if (State.isSoundOn) {
          Sound.stopAll(['bgm', 'lastTen']);
          Sound.play('splatter');
        }
        if (this.fillwordTime == this.answerLength) {
          setTimeout(() => {
            this.checkAnswer(this.answerWrapper.textContent);
          }, 300);
        }
      }
    }
  },
  playSlicedEffect(option = null) {
    if (option) {
      let computedStyle = getComputedStyle(option);
      let currentTransform = computedStyle.transform;
      option.classList.remove('show');
      option.style.backgroundImage = 'none';
      let childSpan = option.querySelector('.option');
      let retrievedLeftSubImage = option.querySelector('.sub-image.left');
      let retrievedRightSubImage = option.querySelector('.sub-image.right');
      let randomLeftTranslate = Math.random() * (-20 - -100) + -100;
      let randomRightTranslate = Math.random() * (100 - 20) + 20;
      let randomDeg = Math.floor(Math.random() * 61);
      retrievedLeftSubImage.style.transform = `translate(${randomLeftTranslate}%) rotate(${randomDeg}deg)`;
      retrievedRightSubImage.style.transform = `translate(${randomRightTranslate}%) rotate(${-randomDeg}deg)`;
      retrievedLeftSubImage.classList.add('slice-left');
      retrievedRightSubImage.classList.add('slice-right');
      if (childSpan) {
        childSpan.style.fontSize = `${0}px`;
      }
      option.classList.add('sliced');
      let matrixValues = currentTransform.match(/matrix.*\((.+)\)/)[1].split(', ');
      let translateY = parseFloat(matrixValues[5]);
      option.style.setProperty('--optionPositionY', `${translateY}px`);
      option.style.setProperty('--bottom-height', `${(View.canvas.height + this.optionSize + 100)}px`);
      /*let rect = option.getBoundingClientRect();
      let posY = rect.top + window.scrollY;
      let bottomDistance = (View.canvas.height + this.optionSize + 50) - posY;
      let speedFactor = 0.005; // Adjust speed factor as needed
      let sliceSpeed = Math.max(bottomDistance * speedFactor, 0.1); // Ensure a minimum speed*/
      option.style.setProperty('--slice-speed', `${0.5}s`);
      option.setAttribute('loop', 'false');

      setTimeout(() => {
        //reset
        option.style.backgroundImage = `url(${option.getAttribute('image')})`;
        retrievedLeftSubImage.style.transform = '';
        retrievedRightSubImage.style.transform = '';
        retrievedLeftSubImage.classList.remove('slice-left');
        retrievedRightSubImage.classList.remove('slice-right');
        if (childSpan) {
          childSpan.style.fontSize = `${option.getAttribute('fontSize')}px`;
        }
        option.classList.remove('sliced');
      }, 800);
    }
  },
  resetFillWord() {
    this.randomPair = this.randomOptions();
    this.clearWrapper();
  },
  backSpaceWord(resetBtn = null) {
    let answerText = this.answerWrapper.textContent;
    if (!this.isTriggeredBackSpace && answerText.length > 0 && answerText !== '') {

      if (resetBtn) resetBtn.classList.add('active');
      if (State.isSoundOn) {
        Sound.stopAll(['bgm', 'lastTen']);
        Sound.play('btnClick');
      }

      this.isTriggeredBackSpace = true;
      this.answerWrapper.textContent = answerText.slice(0, -1);
      this.fillwordTime = answerText.length - 1;

      let delay = 500;
      let lastOption = null;
      if (this.typedItems.length > 0) {
        lastOption = this.typedItems[this.typedItems.length - 1];
        lastOption.setAttribute('loop', 'true');
        console.log('lastOption', lastOption);

        if (lastOption && !lastOption.classList.contains('show')) {
          this.reFallingItems.push(lastOption);
        }
        this.typedItems.pop();
      }

      //let hiddenedOption = this.fallingItems.filter(item => item.optionWrapper.getAttribute('word') === lastChar);
      setTimeout(() => {
        //console.log("this.typedItems", this.typedItems);
        this.isTriggeredBackSpace = false;
      }, delay);
    }
  },
  clearWrapper() {
    this.fallingId = 0;
    this.leftCount = 0;
    this.rightCount = 0;
    this.answerWrapper.classList.remove('correct');
    this.answerWrapper.classList.remove('wrong');
    this.answerWrapper.textContent = '';
    this.fillwordTime = 0;
    this.fallingItems.splice(0);
    View.optionArea.innerHTML = '';
    this.typedItems.splice(0);
    this.selectedCount = 0;
    this.finishedCreateOptions = false;
    this.reFallingItems.splice(0);
    this.refallingId = 0;
  },
  checkAnswer(answer) {
    if (answer === this.randomQuestion.CorrectAnswer) {
      //答岩1分，答錯唔扣分
      var eachQAScore = this.randomQuestion.Score == 0 ? this.eachQAMark : this.randomQuestion.Score;
      this.addScore(eachQAScore);
      this.uploadAnswerToAPI(answer, this.randomQuestion, eachQAScore); /////////////////////////new////////
      this.answerWrapper.classList.add('correct');
      State.changeState('playing', 'ansCorrect');
      View.showCorrectEffect(true);
    } else {
      //this.addScore(-1);
      this.answerWrapper.classList.add('wrong');
      State.changeState('playing', 'ansWrong');
    }
  },
  moveToNextQuestion() {
    this.randomQuestion = null;
    this.randomPair.splice(0);
    View.stageImg.innerHTML = '';
    this.clearWrapper();
    setTimeout(() => {
      this.nextQuestion = true;
    }, 500);
  },

  answeredPercentage(correctedAnswerNumber, totalQuestions = 0) {
    if (totalQuestions === 0) return 0;
    return (correctedAnswerNumber / totalQuestions) * 100;
  },

  uploadAnswerToAPI(answer, currentQuestion, eachMark) {
    if (this.apiManager.isLogined) {
      if (answer === '') return;

      let currentTime;
      let currentQAPercent = 0;
      let correctId = 0;
      let score = 0;
      let answeredPercentage = 0;
      let totalQuestions = this.question.length;
      var progress = Math.floor((this.answeredNum / totalQuestions) * 100);

      if (answer === currentQuestion.CorrectAnswer) {
        if (this.correctedAnswerNumber < totalQuestions) {
          this.correctedAnswerNumber += 1;
        }
        correctId = 2;
        score = eachMark;
        currentQAPercent = 100;
      }
      else {
        if (this.correctedAnswerNumber > 0) {
          this.correctedAnswerNumber -= 1;
        }
      }

      if (this.correctedAnswerNumber < totalQuestions) {
        answeredPercentage = this.answeredPercentage(totalQuestions);
      }
      else {
        answeredPercentage = 100;
      }

      this.apiManager.SubmitAnswer(
        currentTime,
        this.score,
        answeredPercentage,
        progress,
        correctId,
        currentTime,
        currentQuestion.QID,
        currentQuestion.CorrectAnswerId,
        answer,
        currentQuestion.CorrectAnswer,
        score,
        currentQAPercent
      );
    }
  }
}


class State {
  constructor(duration, score, percent, progress) {
    this.duration = duration; // int
    this.score = score;       // float
    this.percent = percent;   // float
    this.progress = progress; // int
  }
}

class CurrentQA {
  constructor(correctId, duration, qid, answerId, answerText, correctAnswerText, score, percent) {
    this.correctId = correctId;                // int
    this.duration = duration;                   // float
    this.qid = qid;                            // string
    this.answerId = answerId;                  // int
    this.answerText = answerText;              // string
    this.correctAnswerText = correctAnswerText; // string
    this.score = score;                         // float
    this.percent = percent;                     // float
  }
}

class Answer {
  constructor(state, currentQA) {
    this.state = state;        // State instance
    this.currentQA = currentQA; // CurrentQA instance
  }
}
