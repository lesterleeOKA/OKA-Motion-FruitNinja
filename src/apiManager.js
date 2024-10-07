const HostName = {
  dev: 'https://dev.openknowledge.hk',
  prod: 'https://www.rainbowone.app/'
};

const apiManager = {
  currentHostName: HostName.dev,
  isLogined: false,
  maxRetries: 10,
  QuestionDataHeaderName: "questions",
  questionJson: null,
  accountJson: null,
  accountUid: -1,
  payloads: null,
  iconDataUrl: null,
  loginName: null,
  jwt: null,

  async postGameSetting(jwt, appId, onCompleted = null, onError = null) {
    let loadQAApi = `${this.currentHostName}/RainbowOne/index.php/PHPGateway/proxy/2.8/?api=ROGame.get_game_setting&json=["${appId}"]&jwt=`;
    this.jwt = jwt;
    const api = loadQAApi + this.jwt;
    console.log("api:", api);
    const formData = new FormData();
    let retryCount = 0;
    let requestSuccessful = false;

    while (retryCount < this.maxRetries && !requestSuccessful) {
      try {
        const response = await fetch(api, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'application/json',
            'typ': 'jwt',
            'alg': 'HS256'
          }
        });

        if (!response.ok) {
          if (onError) onError();
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        const jsonStartIndex = responseText.indexOf(`{"${this.QuestionDataHeaderName}":`);
        if (jsonStartIndex !== -1) {
          const jsonData = responseText.substring(jsonStartIndex);
          console.log("Response:", jsonData);

          const jsonNode = JSON.parse(jsonData);
          this.questionJson = jsonNode.questions;
          this.accountJson = jsonNode.account;
          var accountUidString = jsonNode.account.uid;
          this.accountUid = parseInt(accountUidString, 10);

          const photoJsonUrl = jsonNode.photo;
          this.payloads = jsonNode.payloads;

          console.log("questions:", JSON.stringify(this.questionJson, null, 2));
          console.log(`account: ${JSON.stringify(this.accountJson, null, 2)}`);
          console.log(`photo: ${photoJsonUrl}`);
          console.log("payloads:", JSON.stringify(this.payloads, null, 2));

          if (photoJsonUrl) {
            const modifiedPhotoDataUrl = photoJsonUrl.replace(/"/g, "");
            this.iconDataUrl = modifiedPhotoDataUrl.startsWith("https://")
              ? modifiedPhotoDataUrl
              : "https:" + modifiedPhotoDataUrl;

            console.log(`Downloaded People Icon!! ${this.iconDataUrl}`);
            //this.peopleIcon = await this.loadPeopleIcon(imageUrl);
          }

          if (this.accountJson && this.accountJson.display_name) {
            this.loginName = this.accountJson.display_name.replace(/"/g, "");
            //console.log(`FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFlogin Name: ${this.loginName}`);
          }

          if (onCompleted) onCompleted();
          requestSuccessful = true;

        } else {
          if (onError) onError();
          console.error("JSON data not found in the response.");
        }

      } catch (error) {
        if (onError) onError();
        console.error("Error:", error.message);
        retryCount++;
        console.log(`Retrying... Attempt ${retryCount}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
      }
    }

    if (!requestSuccessful) {
      if (onError) onError();
      console.error(`Failed to get a successful response after ${maxRetries} attempts.`);
    }
  },



  async SubmitAnswer(answer = null, onCompleted = null) {
    // Check for invalid parameters
    if (!this.payloads || this.accountUid === -1 || !this.jwt || !this.isLogined) {
      console.log("Invalid parameters: payloads, accountUid, or jwt is null or empty or login out.");
      return;
    }

    const api = this.submitAnswerAPI(answer, this.payloads, this.accountUid, this.jwt);
    console.debug("Called submit marks API: " + api);
    const maxRetries = this.maxRetries;
    let retryCount = 0;
    let requestSuccessful = false;

    while (retryCount < maxRetries && !requestSuccessful) {
      try {
        const response = await fetch(api, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'typ': 'jwt',
            'alg': 'HS256',
          },
        });

        // Check for HTTP errors
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseText = await response.json();
        console.debug("Success to submit answers: ", JSON.stringify(responseText, null, 2));
        requestSuccessful = true;
        if (onCompleted) onCompleted();

      } catch (error) {
        retryCount++;
        console.error("Error: " + error.message + " Retrying... " + retryCount);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
      }
    }

    if (!requestSuccessful) {
      console.error("Failed to call upload marks response after " + maxRetries + " attempts.");
      if (onCompleted) onCompleted();
    }
  },

  async exitGameRecord(onCompleted = null) {
    // Check for invalid parameters
    if (!this.payloads || this.accountUid === -1 || !this.jwt || !this.isLogined) {
      console.log("Invalid parameters: payloads, accountUid, or jwt is null or empty.");
      return;
    }

    const jsonData = JSON.stringify([{ payloads: this.payloads }]);
    const formData = new FormData();
    formData.append("api", "ROGame.quit_game");
    formData.append("jwt", this.jwt); // Add the JWT to the form
    formData.append("json", jsonData);

    const endGameApi = `${this.currentHostName}/RainbowOne/index.php/PHPGateway/proxy/2.8/?api=ROGame.quit_game`;
    let retryCount = 0;
    const maxRetries = this.maxRetries;
    let requestSuccessful = false;

    while (retryCount < maxRetries && !requestSuccessful) {
      try {
        const response = await fetch(endGameApi, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const responseText = await response.text();
        // Format the JSON response for better readability
        try {
          const parsedJson = JSON.parse(responseText);
          console.log("Success to post end game api:", JSON.stringify(parsedJson, null, 2));
          requestSuccessful = true;
          if (onCompleted) {
            console.log("leave page, window close");
            onCompleted();
          }
        } catch (ex) {
          console.error("Failed to parse JSON:", ex.message);
        }
      } catch (error) {
        retryCount++;
        console.error("Error:", error.message, "Retrying...", retryCount);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
      }
    }

    if (!requestSuccessful) {
      console.error("Failed to call endgame api after", maxRetries, "attempts.");
      if (onCompleted) {
        onCompleted(); // Call onCompleted even if it failed
      }
    }
  },

  submitAnswerAPI(answer, payloads, uid, jwt) {
    const hostName = this.currentHostName;
    const answer = answer;

    const stateDuration = answer.state.duration;
    const stateScore = answer.state.score;
    const statePercent = answer.state.percent;
    const stateProgress = answer.state.progress;

    const correct = answer.currentQA.correctId;
    const currentQADuration = answer.currentQA.duration;
    const currentqid = answer.currentQA.qid;
    const answerId = answer.currentQA.answerId;
    const answerText = answer.currentQA.answerText;
    const correctAnswerText = answer.currentQA.correctAnswerText;
    const currentQAscore = answer.currentQA.score;
    const currentQAPercent = answer.currentQA.percent;

    // Construct the JSON payload
    const jsonPayload = JSON.stringify([{
      payloads: payloads,
      role: { uid: uid },
      state: {
        duration: stateDuration,
        score: stateScore,
        percent: statePercent,
        progress: stateProgress
      },
      currentQuestion: {
        correct: correct,
        duration: currentQADuration,
        qid: currentqid,
        answer: answerId,
        answerText: answerText,
        correctAnswerText: correctAnswerText,
        score: currentQAscore,
        percent: currentQAPercent
      }
    }]);

    // Construct the API endpoint URL
    const submitAPI = `${hostName}/RainbowOne/index.php/PHPGateway/proxy/2.8/?api=ROGame.submit_answer&json=${jsonPayload}&jwt=${jwt}`;
    return submitAPI;
  },
}

export { apiManager };
