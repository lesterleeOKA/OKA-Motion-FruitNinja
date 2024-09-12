import * as posedetection from '@tensorflow-models/pose-detection';
import State from './state';
import Sound from './sound';
import Camera from './camera';
import Game from './fruitNinja';
import Sword from './swords';


export class RendererCanvas2d {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');
    this.videoWidth = canvas.width;
    this.videoHeight = canvas.height;
    this.lastPoseValidValue = false;
    this.modelType = posedetection.SupportedModels.BlazePose;
    this.scoreThreshold = 0.75;
    this.center_shoulder = null;
    this.triggeredAudio = false;
    this.canvasWrapperRect = null;
    this.sword = new Sword("black");
  }

  draw(rendererParams) {
    const [video, poses, isModelChanged, bodySegmentationCanvas] = rendererParams;
    this.videoWidth = video.width;
    this.videoHeight = video.height;
    this.ctx.canvas.width = this.videoWidth;
    this.ctx.canvas.height = this.videoHeight;

    this.redBoxX = this.videoWidth / 3;
    this.redBoxY = this.videoHeight / 5 * 1;
    this.redBoxWidth = this.videoWidth / 3;
    this.redBoxHeight = this.videoHeight / 5 * 4;

    this.drawCtx(video, bodySegmentationCanvas);
    if (['prepare', 'counting3', 'counting2', 'counting1', 'counting0', 'playing', 'outBox'].includes(State.state)) {
      let isCurPoseValid = false;
      if (poses && poses.length > 0 && !isModelChanged) {
        this.drawResults(poses, video.width / video.videoWidth);
        //this.isPoseValid(poses, video.width / video.videoWidth);
        isCurPoseValid = this.isPoseValid(poses, video.width / video.videoWidth);
        if (isCurPoseValid && State.bodyInsideRedBox.value == true) {
          if (State.state == 'prepare' && State.getStateLastFor() > 3500) {
            State.changeState('counting3');
          } else if (State.state == 'counting3' && State.getStateLastFor() > 1000) {
            State.changeState('counting2');
          } else if (State.state == 'counting2' && State.getStateLastFor() > 1000) {
            State.changeState('counting1');
          } else if (State.state == 'counting1' && State.getStateLastFor() > 1000) {
            State.changeState('counting0');
          } else if (State.state == 'counting0' && State.getStateLastFor() > 1000) {
            State.changeState('playing', 'showStage');
          } else if (State.state == 'playing') {

            if (State.stageType == 'showStage' && State.getStateLastFor() > 1000) {
              //State.changeState('playing', 'showQstImg');
            } else if (State.stateType == 'waitAns') {
              if (State.selectedImg.value && State.selectedImg.lastFor > 1000) {
                //1秒掂到就得，唔駛倒數
                //State.changeState('playing', Game.checkAnswer() ? 'ansCorrect' : 'ansWrong');
                //State.changeState('playing', 'touched1');
              }
            } else if (State.stateType == 'touched1') {
              if (State.selectedImg.value && State.selectedImg.lastFor > 2000) {
                State.changeState('playing', 'touched2');
              } else if (!State.selectedImg.value) {
                State.changeState('playing', 'waitAns');
              }
            } else if (State.stateType == 'touched2') {
              if (State.selectedImg.value && State.selectedImg.lastFor > 3000) {
                //let isCorrect = Game.checkAnswer();
                // State.changeState('playing', isCorrect ? 'ansCorrect' : 'ansWrong');
              } else if (!State.selectedImg.value) {
                State.changeState('playing', 'waitAns');
              }
            }
          } else if (State.state == 'outBox' && State.bodyInsideRedBox.lastFor > 2000) {
            State.changeState('playing', 'waitAns');
          }
        }
        else {
          this.sword.clearSwipes();
        }
      }
      this.sword.update();
      this.sword.draw(this.ctx);
      this.drawBox(isCurPoseValid);
    }
  }

  isPoseValid(poses) {
    if (!poses[0]) return false;
    let pose = poses[0];
    let passScore = this.scoreThreshold;
    let isBodyOutBox;

    if (pose.keypoints != null) {
      //我建議膊頭兩點，腰兩點，膝頭兩點，手肘兩點，手腕兩點入框就可以玩
      //nose, left_eye_inner, left_eye, left_eye_outer, right_eye_inner, right_eye, right_eye_outer, left_ear, right_ear, mouth_left, mouth_right, left_shoulder, right_shoulder, left_elbow, right_elbow, left_wrist, right_wrist, left_pinky, right_pinky, left_index, right_index, left_thumb, right_thumb, left_hip, right_hip, left_knee, right_knee, left_ankle, right_ankle, left_heel, right_heel, left_foot_index, right_foot_index
      //let checkKeypoints = pose.keypoints.filter(k=>['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hip', 'right_hip', 'left_knee', 'right_knee'].includes(k.name) && k.score>0.65);

      /*if (this.center_shoulder) {
        isBodyOutBox = ((
          this.center_shoulder.x < this.redBoxX ||
          this.center_shoulder.x > (this.redBoxX + this.redBoxWidth) ||
          this.center_shoulder.y < this.redBoxX ||
          this.center_shoulder.y > (this.redBoxY + this.redBoxHeight)) ? true : false);
      }
      else {
        isBodyOutBox = false;
      }

      let checkKeypoints = pose.keypoints.filter(k => k.name == 'nose' && k.score > passScore);
      let isBodyOutBox = (
        checkKeypoints.find(keypoint => (
          keypoint.x < this.redBoxX ||
          keypoint.x > (this.redBoxX + this.redBoxWidth) ||
          keypoint.y < this.redBoxY ||
          keypoint.y > (this.redBoxY + this.redBoxHeight)
        )) ? true : false
      );*/

      if (this.center_shoulder) {
        const isShoulderOutBox = (
          this.center_shoulder.x < this.redBoxX ||
          this.center_shoulder.x > (this.redBoxX + this.redBoxWidth) ||
          this.center_shoulder.y < this.redBoxY ||
          this.center_shoulder.y > (this.redBoxY + this.redBoxHeight)
        );

        const isNoseOutBox = pose.keypoints
          .filter(k => k.name === 'nose' && k.score > passScore)
          .some(keypoint =>
            keypoint.x < this.redBoxX ||
            keypoint.x > (this.redBoxX + this.redBoxWidth) ||
            keypoint.y < this.redBoxY ||
            keypoint.y > (this.redBoxY + this.redBoxHeight)
          );

        isBodyOutBox = isShoulderOutBox && isNoseOutBox;
      } else {
        const isNoseOutBox = pose.keypoints
          .filter(k => k.name === 'nose' && k.score > passScore)
          .some(keypoint =>
            keypoint.x < this.redBoxX ||
            keypoint.x > (this.redBoxX + this.redBoxWidth) ||
            keypoint.y < this.redBoxY ||
            keypoint.y > (this.redBoxY + this.redBoxHeight)
          );

        isBodyOutBox = isNoseOutBox;
      }

      State.setPoseState('bodyInsideRedBox', !isBodyOutBox);
      if (isBodyOutBox) {
        if (State.state == 'playing') State.changeState('outBox', 'outBox');
        //console.log('outBox', 'outBox');
        return false;
      }

      let questionBoard = null;

      if (Game.randomQuestion) {
        if (Game.randomQuestion.type === 'Listening') {
          questionBoard = document.querySelector('.questionAudioBg');
        }
        else if (Game.randomQuestion.type === 'FillingBlank') {
          questionBoard = document.querySelector('.questionImgBg');
        }
      }

      let resetBtn = document.querySelector('.resetBtn');
      let audioBtn = document.querySelector('.buttonWrapper');

      const rightHandImg = document.getElementById('right-hand');
      const leftHandImg = document.getElementById('left-hand');

      //檢查是否有選到圖
      let optionWrappers = document.querySelectorAll('.canvasWrapper > .optionArea > .optionWrapper.show');
      let canvasWrapper = document.querySelector('.canvasWrapper');
      this.canvasWrapperRect = canvasWrapper.getBoundingClientRect();
      if (State.state == 'playing' && ['waitAns'].includes(State.stateType)) {
        let checkKeypoints = pose.keypoints.filter(k => ['right_wrist', 'left_wrist'/*, 'right_index', 'left_index'*/].includes(k.name) && k.score > passScore);
        let touchingWord = [];

        rightHandImg.style.display = 'none';
        leftHandImg.style.display = 'none';

        if (checkKeypoints.length == 0)
          this.sword.clearSwipes();

        for (let point of checkKeypoints) {
          switch (point.name) {
            case 'right_wrist':
              const rightWristX = point.x;
              const rightWristY = point.y;
              let xInVw_right = (rightWristX / window.innerWidth) * 95;
              let yInVw_right = (window.innerWidth / 12);
              rightHandImg.style.left = `calc(${xInVw_right}vw - calc(min(3vh, 3vw)))`;
              rightHandImg.style.top = `${rightWristY - yInVw_right}px`;
              rightHandImg.style.display = 'block';

              this.sword.swipe(rightWristX, rightWristY);
              this.handleWristDetection(optionWrappers, resetBtn, rightWristX, rightWristY);
              break;
            case 'left_wrist':
              const leftWristX = point.x;
              const leftWristY = point.y;
              let xInVw_left = (leftWristX / window.innerWidth) * 105;
              let yInVw_left = (window.innerWidth / 12);
              leftHandImg.style.left = `calc(${xInVw_left}vw - calc(min(3vh, 3vw)))`;
              leftHandImg.style.top = `${leftWristY - yInVw_left}px`;
              leftHandImg.style.display = 'block';

              this.sword.swipe(leftWristX, leftWristY);
              this.handleWristDetection(optionWrappers, resetBtn, leftWristX, leftWristY);
              break;
          }
        }

        const rightHandLeft = rightHandImg.offsetLeft;
        const rightHandTop = rightHandImg.offsetTop;
        const rightHandWidth = rightHandImg.offsetWidth;
        const rightHandHeight = rightHandImg.offsetHeight;

        const leftHandLeft = leftHandImg.offsetLeft;
        const leftHandTop = leftHandImg.offsetTop;
        const leftHandWidth = leftHandImg.offsetWidth;
        const leftHandHeight = leftHandImg.offsetHeight;

        for (let option of optionWrappers) {

          const optionRect = option.getBoundingClientRect();
          if (rightHandImg.style.display !== 'none' &&
            rightHandLeft < (optionRect.right - this.canvasWrapperRect.left) &&
            (rightHandLeft + rightHandWidth) > (optionRect.left - this.canvasWrapperRect.left) &&
            rightHandTop < (optionRect.bottom - this.canvasWrapperRect.top) &&
            (rightHandTop + rightHandHeight) > (optionRect.top - this.canvasWrapperRect.top) &&
            !Game.isTriggeredBackSpace
          ) {
            touchingWord.push(option);
          }

          if (leftHandImg.style.display !== 'none' &&
            leftHandLeft < (optionRect.right - this.canvasWrapperRect.left) &&
            (leftHandLeft + leftHandWidth) > (optionRect.left - this.canvasWrapperRect.left) &&
            leftHandTop < (optionRect.bottom - this.canvasWrapperRect.top) &&
            (leftHandTop + leftHandHeight) > (optionRect.top - this.canvasWrapperRect.top) &&
            !Game.isTriggeredBackSpace
          ) {
            touchingWord.push(option);
          }
        }

        this.triggeredAudio = false;

        if (audioBtn) {
          const audioBtnRect = audioBtn.getBoundingClientRect();
          let audioRectHalf = (audioBtnRect.width * 0.5);
          if (rightHandImg.style.display !== 'none' &&
            rightHandLeft < (audioBtnRect.right - audioRectHalf - this.canvasWrapperRect.left) &&
            (rightHandLeft + rightHandWidth) > (audioBtnRect.left - this.canvasWrapperRect.left) + audioRectHalf &&
            rightHandTop < (audioBtnRect.bottom - this.canvasWrapperRect.top) &&
            (rightHandTop + rightHandHeight) > (audioBtnRect.top - this.canvasWrapperRect.top)
          ) {
            if (!this.triggeredAudio) {
              Game.motionTriggerPlayAudio(true);
              this.triggeredAudio = true;
            }
          }

          if (leftHandImg.style.display !== 'none' &&
            leftHandLeft < (audioBtnRect.right - audioRectHalf - this.canvasWrapperRect.left) &&
            (leftHandLeft + leftHandWidth) > (audioBtnRect.left - this.canvasWrapperRect.left) + audioRectHalf &&
            leftHandTop < (audioBtnRect.bottom - this.canvasWrapperRect.top) &&
            (leftHandTop + leftHandHeight) > (audioBtnRect.top - this.canvasWrapperRect.top)
          ) {
            if (!this.triggeredAudio) {
              Game.motionTriggerPlayAudio(true);
              this.triggeredAudio = true;
            }
          }

          if (audioBtn.classList.contains('clicked')) {
            if (!Game.touchBtn) {
              if (!this.triggeredAudio) Game.motionTriggerPlayAudio(false);
            }
          }
        }

        if (resetBtn) {
          if (!Game.isTriggeredBackSpace && resetBtn.classList.contains('active') && !Game.touchBtn) {
            resetBtn.classList.remove('active');
          }
        }

        for (let option of optionWrappers) {
          if (touchingWord.includes(option) && !option.classList.contains('touch')) {
            State.setPoseState('selectedImg', option);
            //console.log("touch ", option);
            Game.fillWord(option);
          }
        }

        if (touchingWord.length === 0) State.setPoseState('selectedImg', '');
      }
      else if (State.state == 'playing' && ['wrong'].includes(State.stateType)) {
        for (let option of optionWrappers) option.classList.remove('touch');
        State.changeState('playing', 'waitAns');
      }

      return true;
    } else {
      return false;
    }
  }

  handleWristDetection(optionWrappers, resetBtn, wristX, wristY) {
    const offsetX = (window.innerWidth / 7.68);
    if (resetBtn) {
      if (
        wristX > resetBtn.offsetLeft * 2 + offsetX &&
        wristX < (resetBtn.offsetLeft * 2 + resetBtn.offsetWidth * 2) + (offsetX / 2) &&
        wristY - 30 > resetBtn.offsetTop &&
        wristY - 130 < (resetBtn.offsetTop + resetBtn.offsetHeight)
      ) {
        if (!Game.isTriggeredBackSpace) {
          for (let option of optionWrappers) option.classList.remove('touch');
          Game.backSpaceWord(resetBtn);
        }
      }
    }


  }

  drawBox(isCurPoseValid) {
    //this.ctx.translate(this.videoWidth, 0);
    //this.ctx.scale(-1, 1);
    this.ctx.beginPath();
    this.ctx.lineWidth = isCurPoseValid ? 1 : Math.max(10, this.videoHeight * 0.01);//20230821老師話想轉1px白色  Math.max(10, this.videoHeight * 0.01);
    //this.ctx.roundRect(this.redBoxX, this.redBoxY, this.redBoxWidth, this.redBoxHeight, [this.videoHeight * 0.02]);
    this.ctx.rect(this.redBoxX, this.redBoxY, this.redBoxWidth, this.redBoxHeight);
    this.ctx.strokeStyle = isCurPoseValid ? '#FFFFFF' : '#ff0000';//20230821老師話想轉1px白色  isCurPoseValid ? '#00ff00' : '#ff0000';
    this.ctx.stroke();
    if (!this.lastPoseValidValue && isCurPoseValid && State.isSoundOn) Sound.play('poseValid');
    this.lastPoseValidValue = isCurPoseValid;
  }

  drawCtx(video, bodySegmentationCanvas) {
    if (Camera.constraints.video.facingMode == 'user') {
      this.ctx.translate(this.videoWidth, 0);
      this.ctx.scale(-1, 1);
    }
    this.ctx.drawImage(bodySegmentationCanvas ? bodySegmentationCanvas : video, 0, 0, this.videoWidth, this.videoHeight);
    if (Camera.constraints.video.facingMode == 'user') {
      this.ctx.translate(this.videoWidth, 0);
      this.ctx.scale(-1, 1);
    }
  }

  clearCtx() {
    this.ctx.clearRect(0, 0, this.videoWidth, this.videoHeight);
  }

  drawResults(poses, ratio) {
    for (const pose of poses) {
      this.drawResult(pose, ratio);
    }
  }

  drawResult(pose, ratio) {
    if (pose.keypoints != null) {
      this.keypointsFitRatio(pose.keypoints, ratio);
      this.drawKeypoints(pose.keypoints);
      this.drawSkeleton(pose.keypoints, pose.id);
    }
  }

  drawKeypoints(keypoints) {
    const keypointInd = posedetection.util.getKeypointIndexBySide(this.modelType);
    this.ctx.fillStyle = 'Red';
    this.ctx.strokeStyle = 'White';
    this.ctx.lineWidth = 2;

    for (const i of keypointInd.middle) {
      this.drawKeypoint(keypoints[i]);
    }

    this.ctx.fillStyle = 'Green';
    for (const i of keypointInd.left) {
      this.drawKeypoint(keypoints[i]);
    }

    this.ctx.fillStyle = 'Orange';
    for (const i of keypointInd.right) {
      this.drawKeypoint(keypoints[i]);
    }
  }

  keypointsFitRatio(keypoints, ratio) {
    for (let keypoint of keypoints) {
      keypoint.x = (Camera.constraints.video.facingMode == 'user') ? this.videoWidth - (keypoint.x * ratio) : (keypoint.x * ratio);
      keypoint.y = keypoint.y * ratio;
    }
  }

  drawKeypoint(keypoint) {
    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1;
    //const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;

    if (score >= this.scoreThreshold) {
      const circle = new Path2D();
      circle.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
      this.ctx.fill(circle);
      this.ctx.stroke(circle);
    }
  }

  drawSkeleton(keypoints, poseId) {
    const color = 'White';
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;

    let left_shoulder = null;
    let right_shoulder = null;

    posedetection.util.getAdjacentPairs(this.modelType).forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      // If score is null, just show the keypoint.
      const score1 = kp1.score != null ? kp1.score : 1;
      const score2 = kp2.score != null ? kp2.score : 1;

      if (score1 >= this.scoreThreshold && score2 >= this.scoreThreshold) {
        this.ctx.beginPath();
        this.ctx.moveTo(kp1.x, kp1.y);
        this.ctx.lineTo(kp2.x, kp2.y);
        this.ctx.stroke();
      }

      if (kp1.name === 'left_shoulder') left_shoulder = kp1;
      if (kp1.name === 'right_shoulder') right_shoulder = kp1;

      if (kp2.name === 'left_shoulder') left_shoulder = kp2;
      if (kp2.name === 'right_shoulder') right_shoulder = kp2;
    });

    // Draw circle around the head
    if (left_shoulder && right_shoulder) {
      const center_shoulderX = (left_shoulder.x + right_shoulder.x) / 2;
      const center_shoulderY = (left_shoulder.y + right_shoulder.y) / 2;

      this.center_shoulder = {
        x: center_shoulderX,
        y: center_shoulderY,
      };

      if (this.center_shoulder) {
        // Draw the keypoint as a circle
        this.ctx.fillStyle = 'Blue';
        this.ctx.strokeStyle = 'White';
        this.ctx.lineWidth = 2;
        const circle = new Path2D();
        circle.arc(this.center_shoulder.x, this.center_shoulder.y, 4, 0, 2 * Math.PI);
        this.ctx.fill(circle);
        this.ctx.stroke(circle);
      }
    }

  }

}
