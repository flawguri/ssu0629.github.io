let shared;
let clickCount;
let totalAccelerationChange = 0;
let guests;
let me;
let game2;
let lastMotionTime;
const threshold = 2; // 가속도 변화율 기준치 설정 (필요에 따라 조정 가능)
const decayRate = 0.9; // 가속도 감소율
const initialIgnoreCount = 5; // 초기 측정값 무시 횟수
let ignoreCount = initialIgnoreCount;

// 애니메이션은 모터와 배터리 두 종류가 있음
// 나중에 다른 파일과 합쳐졌을 때를 대비해서
// 모터 미니게임의 에셋들의 파일 이름과 변수는 motor로 시작
let motorImgs = []; // 모터 돌아가는 모션, 8프레임
let motorBatteryImgs = []; // 배터리가 늘어나는 모션, 8프레임인데 마지막은 초록색 충전 완료 표시
let motorBgImg; // 배경 및 안움직이는 그림
let motorImg; // Imgs: 모든 프레임, Img: 현재 프레임
let motorImgNow = 0; //~ImgNow: 애니메이션이 몇번째 프레임인지
let motorBatteryImg;
let motorBatteryImgNow = 0;
let introImg; // 시작 화면 이미지

// 버튼 상태 이미지
let buttonStartImg;
let buttonStartOverImg;
let buttonStartPressedImg;
let buttonState = "normal"; // 버튼 상태: "normal", "over", "pressed"
let buttonX, buttonY, buttonWidth, buttonHeight;

// DOMContentLoaded 이벤트 리스너를 추가하여 HTML 문서가 완전히 로드된 후 onClick 함수를 버튼 클릭 이벤트에 연결
document.addEventListener("DOMContentLoaded", function () {
  const activateButton = document.getElementById('activateButton');
  if (activateButton) {
    activateButton.addEventListener('click', onClick);
  } else {
    console.error("Activate button not found.");
  }
});

// onClick 함수는 iOS 기기에서 motion 권한을 요청합니다.
function onClick() {
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          window.addEventListener('devicemotion', cb);
        }
      })
      .catch(console.error);
  } else {
    window.addEventListener('devicemotion', cb);
    // iOS 13 이전 버전이나 다른 장치에서는 권한 요청 없이 바로 이벤트를 추가
  }
}

// devicemotion 이벤트 콜백 함수
function cb(event) {
  const acc = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
  const accWithoutGravity = event.acceleration || { x: 0, y: 0, z: 0 };

  // 중력 보정
  const alpha = 0.8;
  me.gravity = me.gravity || { x: 0, y: 0, z: 0 };

  me.gravity.x = alpha * me.gravity.x + (1 - alpha) * acc.x;
  me.gravity.y = alpha * me.gravity.y + (1 - alpha) * acc.y;
  me.gravity.z = alpha * me.gravity.z + (1 - alpha) * acc.z;

  const adjustedAcc = {
    x: acc.x - me.gravity.x,
    y: acc.y - me.gravity.y,
    z: acc.z - me.gravity.z,
  };

  const acceleration = Math.sqrt(adjustedAcc.x * adjustedAcc.x + adjustedAcc.y * adjustedAcc.y + adjustedAcc.z * adjustedAcc.z) || 0;

  if (!me.previousAcceleration) {
    me.previousAcceleration = acceleration;
  }

  const accelerationChange = Math.abs(acceleration - me.previousAcceleration);
  me.previousAcceleration = acceleration;

  // 초기 측정값 무시
  if (ignoreCount > 0) {
    ignoreCount--;
    me.accelerationChange = 0;
  } else {
    if (accelerationChange > threshold) { // 기준치를 넘는 경우에만 업데이트
      me.accelerationChange = accelerationChange;
      lastMotionTime = millis();
    } else {
      me.accelerationChange = 0;
    }
  }

  console.log(`Acceleration Change: ${me.accelerationChange}`); // 가속도 변화를 콘솔에 출력
}

// p5.js preload 함수로 party.js 연결 및 공유 데이터 초기화
function preload() {
  partyConnect(
    "wss://demoserver.p5party.org",
    "party_circle"
  );

  // 애니메이션 파일 불러오기
  for (let i = 1; i < 9; i++) { // 파일이름이 1부터 8임 (0부터 7이 아님)
    motorImgs[i] = loadImage("assets/motor" + i + ".png");
    motorBatteryImgs[i] = loadImage("assets/motor_battery" + i + ".png");
  }
  motorBgImg = loadImage("assets/motor_bg.png");
  introImg = loadImage("assets/intro.png"); // 시작 화면 이미지 파일 로드

  // 버튼 이미지 불러오기
  buttonStartImg = loadImage("assets/buttonStart.png");
  buttonStartOverImg = loadImage("assets/buttonStartOver.png");
  buttonStartPressedImg = loadImage("assets/buttonStartPressed.png");

  shared = partyLoadShared("shared", { x: 200, y: 200 });
  clickCount = partyLoadShared("clickCount", { value: 0 });
  guests = partyLoadGuestShareds();
  me = partyLoadMyShared({ accelerationChange: 0 });

  neoDunggeunmoProFont = loadFont("assets/NeoDunggeunmoPro-Regular.ttf"); // 폰트 로드
}

// p5.js setup 함수로 캔버스 설정 및 초기 값 설정
function setup() {
  createCanvas(1280, 960); // 1280x960 크기의 캔버스를 생성
  noStroke(); // 윤곽선 없음

  // 호스트인 경우 초기 값을 설정
  if (partyIsHost()) {
    clickCount.value = 0;
    shared.x = 200;
    shared.y = 200;
  }

  totalAccelerationChange = 0; // 총 가속도 변화율 초기화
  lastMotionTime = millis();

  game2 = new Motorgame();

  // 버튼 위치 및 크기 설정
  buttonX = windowWidth / 2 - 100;
  buttonY = windowHeight / 2 + 150;
  buttonWidth = 200;
  buttonHeight = 50;
}

// 마우스를 클릭하면 공유 객체의 위치를 업데이트하고 클릭 수를 증가
function mousePressed() {
  if (game2.gameState === "intro") {
    // 시작 화면에서 시작 버튼을 누르면 게임 시작
    if (mouseX > buttonX && mouseX < buttonX + buttonWidth && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      buttonState = "pressed";
    }
  } else {
    shared.x = mouseX;
    shared.y = mouseY;
    clickCount.value++;

    if (game2.gameState === "success") {
      let buttonX = width / 2 - 100;
      let buttonY = height / 2 + 50;
      let buttonWidth = 200;
      let buttonHeight = 50;

      if (mouseX > buttonX && mouseX < buttonX + buttonWidth && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
        game2.reset();
      }
    }
  }
}

function mouseReleased() {
  if (game2.gameState === "intro" && buttonState === "pressed") {
    if (mouseX > buttonX && mouseX < buttonX + buttonWidth && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      game2.gameState = "playing";
    }

    buttonState = "normal";
  }
}

function mouseMoved() {
  if (game2.gameState === "intro") {
    if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth && mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
      buttonState = "over";
    } else {
      buttonState = "normal";
    }
  }
}

// p5.js draw 함수로 매 프레임마다 호출되며 화면을 업데이트
function draw() {
  background('#ffcccc'); // 배경색 설정
  fill("#000066"); // 도형 색상 설정

  if (game2.gameState === "intro") {
    // 시작 화면 표시
    image(introImg, windowWidth / 2 - 400, windowHeight / 2 - 300, 800, 600);
    let buttonImg;
    if (buttonState === "normal") {
      buttonImg = buttonStartImg;
    } else if (buttonState === "over") {
      buttonImg = buttonStartOverImg;
    } else if (buttonState === "pressed") {
      buttonImg = buttonStartPressedImg;
    }

    image(buttonImg, buttonX, buttonY, buttonWidth, buttonHeight);
  } else {
    // 게임 화면 표시
    // 애니메이션 배경 그리기
    noSmooth();
    noStroke();
    image(motorBgImg, windowWidth / 2 - 400, windowHeight / 2 - 300, 800, 600); // 6.25배 확대

    totalAccelerationChange = 0; // 초기화

    // 기준치를 넘는 경우에만 현재 기기의 가속도 변화를 저장
    if (me.accelerationChange > threshold) {
      totalAccelerationChange = me.accelerationChange;
    }

    // 각 게스트의 가속도 변화 값을 합산
    for (let i = 0; i < guests.length; i++) {
      if (guests[i].accelerationChange > threshold) {
        totalAccelerationChange += guests[i].accelerationChange;
      }
    }

    console.log(`Total Acceleration Change: ${totalAccelerationChange}`); // 합산된 가속도 변화 값을 콘솔에 출력

    game2.update(totalAccelerationChange);
    game2.display();

    // 모터 애니메이션
    if (game2.acceleration > 0 && game2.gameState === "playing") {
      motorImgNow = (motorImgNow + 1) % 8; // 애니메이션 프레임 업데이트
    }
    motorImg = motorImgs[motorImgNow + 1];
    image(motorImg, windowWidth / 2 - 400, windowHeight / 2 - 300, 800, 600);

    // 배터리 애니메이션
    motorBatteryImgNow = int(1 + 7 * (game2.energy / 1000)); // 점수 0~1000 값을 1~8로 나오도록
    motorBatteryImg = motorBatteryImgs[motorBatteryImgNow];
    image(motorBatteryImg, windowWidth / 2 - 455, windowHeight / 2 - 300, 800, 600);
  }
}

// 모터 돌리기 게임 class
class Motorgame {
  constructor() {
    this.acceleration = 0;
    this.maxAcceleration = 60;
    this.energy = 0;
    this.maxEnergy = 10000;
    this.gameState = "intro"; // 게임 상태: "intro", "playing", "success", "fail"
  }

  update(totalAccelerationChange) {
    if (this.gameState === "playing") {
      if (totalAccelerationChange > threshold) { // 기준치를 넘는 경우에만 업데이트
        this.acceleration = min(totalAccelerationChange, this.maxAcceleration);
        this.energy = min(this.energy + this.acceleration * 0.5, this.maxEnergy);
      } else {
        // 가속도 변화가 기준치 이하일 때 에너지를 감소
        this.acceleration = 0;
        this.energy = max(this.energy - 5, 0);
      }

      // 에너지가 최대치에 도달하면 게임 성공 상태로 전환
      if (this.energy >= this.maxEnergy) {
        this.gameState = "success";
      }
    }
  }

  display() {
    if (this.gameState === "playing") {
      // 에너지 게이지 그리기
      this.drawEnergyGauge(this.energy, this.maxEnergy);
    } else if (this.gameState === "success") {

      textFont(neoDunggeunmoProFont); // NeoDunggeunmoPro-Regular 폰트 설정
      textSize(64);
      fill(0);
      textAlign(CENTER, CENTER);
      text("게임 성공!", width / 2, height / 2);

      // 게임 성공 후에도 배터리 이미지를 유지
      motorBatteryImgNow = 8; // 충전 완료된 배터리 이미지로 설정
      motorBatteryImg = motorBatteryImgs[motorBatteryImgNow];
      image(motorBatteryImg, windowWidth / 2 - 455, windowHeight / 2 - 300, 800, 600);

      // 다시 도전 버튼 그리기
      game2.drawRetryButton();
  
    }
  }

  drawEnergyGauge(energy, maxEnergy) {
    let gaugeWidth = 200;
    let gaugeHeight = 20;
    let filledWidth = map(energy, 0, maxEnergy, 0, gaugeWidth);

    fill(200);
    rect(width / 2 - gaugeWidth / 2, height - 40, gaugeWidth, gaugeHeight);
    fill(0, 255, 0);
    rect(width / 2 - gaugeWidth / 2, height - 40, filledWidth, gaugeHeight);
  }

  drawRetryButton() {
    fill(0, 255, 0);
    rect(width / 2 - 100, height / 2 + 50, 200, 50);
    fill(0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("다시 도전", width / 2, height / 2 + 75);
  }

  reset() {
    this.acceleration = 0;
    this.energy = 0;
    this.gameState = "playing";
  }
}
