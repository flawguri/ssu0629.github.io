let shared;
let clickCount;
let totalDeg;
let guests;
let me;

////////수정사항/////////
//애니메이션 추가로 코드 수정한 곳
// assets폴더
// preload에 이미지 불러오기
// draw에 루프하는 배경 추가
// class안의 display, spawnObstacle
// 캔버스 크기 바꿈
let dodgeImgRobots = []; //로봇 애니메이션 전체파일
let dodgeImgFrame = 0; //로봇 현재 프레임 저장
let dodgeImgBg;
let dodgeImgBgStars = []; //배경에 있는 별은 레이어 2개 있습니다
let dodgeImgObstacles = []; //장애물 이미지 5개 있습니다

let dodgeBgSpeed;
let dodgeBgY=0 //배경 스크롤 초기 위치 변수
let dodgeBgY2; //!!setup()에서 초기화 해요
let dodgeBgY3=0
let dodgeBgY4;
let dodgeBgY5=0
let dodgeBgY6;
  


document.addEventListener("DOMContentLoaded", function() {
  const activateButton = document.getElementById('activateButton');
  activateButton.addEventListener('click', onClick);
});

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
  }
}

function cb(event) {
  console.log(event.rotationRate);
}

function preload() {
  partyConnect(
    "wss://demoserver.p5party.org",
    "party_circle"
  );
  shared = partyLoadShared("shared", { x: 100, y: 100 });
  clickCount = partyLoadShared("clickCount", { value: 0 });
  guests = partyLoadGuestShareds();
  me = partyLoadMyShared({ degX: 0 });


  //이미지 프리로드
  for (let i = 0; i < 2; i++) { // 파일이름 0부터 1까지 불러오기
    dodgeImgRobots[i] = loadImage("assets/dodge/dodgeRobot" + i + ".png");
    dodgeImgBgStars[i] = loadImage("assets/dodge/dodgeBgStar" + i + ".png");
  }
  for (let i = 0; i < 5; i++) { // 파일이름 0부터 4까지 불러오기
    dodgeImgObstacles[i] = loadImage("assets/dodge/dodgeObstacle" + i + ".png");
  }
  dodgeImgBg = loadImage("assets/dodge/dodgeBgSpace.png");

}

let game; // 게임 인스턴스를 전역으로 선언하여 draw 함수에서 접근 가능하게 함

function setup() {
  createCanvas(windowWidth, windowHeight);
  //배경 이미지 루프를 위한 초기화, 배경 이미지 세로 길이가 -windowWidth*2
  dodgeBgY2 = -windowWidth*2
  dodgeBgY4 = -windowWidth*2
  dodgeBgY6 = -windowWidth*2

  noStroke();

  if (partyIsHost()) {
    clickCount.value = 0;
    shared.x = 200;
    shared.y = 200;
  }

  totalDeg = 0;

  game = new ObstacleGame(); // 장애물 피하기 게임 클래스 인스턴스 생성

  // 핸드폰 기울기 이벤트 리스너 추가
  window.addEventListener('devicemotion', handleMotionEvent);
}

function handleMotionEvent(event) {
  const acceleration = event.accelerationIncludingGravity;
  if (acceleration) {
    const accelerationX = acceleration.x;
    game.handleMotion(accelerationX);
  }
}

function draw() {
  // 배경 색상 설정
  background('#41388d');


  // 무한 루프되는 배경
  // 배경 비율은 1:2(세로가 더 김), 가로길이는 windowWidth, 세로는 2배
  dodgeBgHeight = windowWidth*2 //배경 이미지의 세로 길이
  dodgeBgSpeed = 3 // 스크롤의 속도를 조절함
  dodgeBgY += dodgeBgSpeed  //우주
  dodgeBgY2 += dodgeBgSpeed //우주2
  dodgeBgY3 += dodgeBgSpeed *0.3 //별1
  dodgeBgY4 += dodgeBgSpeed *0.3 //별2
  dodgeBgY5 += dodgeBgSpeed *0.1 //별3
  dodgeBgY6 += dodgeBgSpeed *0.1 //별4

  image(dodgeImgBg,0,dodgeBgY,windowWidth,dodgeBgHeight) //첫 이미지
  image(dodgeImgBg,0,dodgeBgY2,windowWidth,dodgeBgHeight) //그 위 이미지
  blendMode(LIGHTEST)  //블렌드 모드
  image(dodgeImgBgStars[0],0,dodgeBgY3,windowWidth,dodgeBgHeight)
  image(dodgeImgBgStars[0],0,dodgeBgY4,windowWidth,dodgeBgHeight)
  image(dodgeImgBgStars[1],0,dodgeBgY5,windowWidth,dodgeBgHeight)
  image(dodgeImgBgStars[1],0,dodgeBgY6,windowWidth,dodgeBgHeight)
  if (dodgeBgY >= dodgeBgHeight-10) dodgeBgY=-dodgeBgHeight; //다 내려오면 위로 올림
  if (dodgeBgY2 >= dodgeBgHeight-10) dodgeBgY2=-dodgeBgHeight;
  if (dodgeBgY3 >= dodgeBgHeight-10) dodgeBgY3=-dodgeBgHeight; 
  if (dodgeBgY4 >= dodgeBgHeight-10) dodgeBgY4=-dodgeBgHeight;
  if (dodgeBgY5 >= dodgeBgHeight-10) dodgeBgY5=-dodgeBgHeight; 
  if (dodgeBgY6 >= dodgeBgHeight-10) dodgeBgY6=-dodgeBgHeight;
  blendMode(BLEND) //블렌드 모드 초기화



  fill("#000066");

  me.degY = rotationY;

  for (let i = 0; i < guests.length; i++) {
    totalDeg += guests[i].degY;
  }

  textAlign(CENTER, CENTER);
  text(clickCount.value, width / 2, height / 2);
  text(radians(totalDeg), width / 2, 100);

  totalDeg = 0;

  if (!game.gameOver) {
    game.update(); // 게임 업데이트
    game.display(frameCount); // 게임 화면 표시
  } else {
    textSize(32);
    fill(255, 0, 0);
    text("Game Over", width / 2, height / 2);
    game.showRestartButton(); // 게임 오버 시 다시 시작 버튼 표시
    noLoop(); // 게임 루프 정지
  }

  // 미니맵 그리기
  game.drawMiniMap();
}

class ObstacleGame {
  constructor() {
    this.player = { x: width / 2, y: height - 50, size: 120 };
    this.obstacles = [];
    this.speed = 2;
    this.spawnRate = 60;
    this.counter = 0;
    this.distanceTraveled = 0;
    this.totalDistance = 5000; // 총 이동 거리 (맵의 길이)
    this.gameOver = false;

    // 다시 시작 버튼 생성 및 숨기기
    this.restartButton = createButton('Restart');
    this.restartButton.position(width / 2 - 40, height / 2 + 40);
    this.restartButton.mousePressed(() => this.reset());
    this.restartButton.hide();
  }

  reset() {
    this.player = { x: width / 2, y: height - 50, size: 120 };
    this.obstacles = [];
    this.counter = 0;
    this.distanceTraveled = 0;
    this.gameOver = false;
    this.restartButton.hide();
    loop(); // 게임 루프 재시작
  }

  handleMotion(accelerationX) {
    // 기울기 값을 사용하여 플레이어 이동
    const sensitivity = 2; // 기울기 민감도 조절
    this.player.x += accelerationX * sensitivity;

    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x > width) this.player.x = width;
  }

  update() {
    this.counter++;
    this.distanceTraveled += this.speed; // 이동 거리 증가

    if (this.counter % this.spawnRate === 0) {
      this.spawnObstacle();
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.obstacles[i].y += this.speed;

      if (this.obstacles[i].y > height) {
        this.obstacles.splice(i, 1);
      }

      if (this.isColliding(this.player, this.obstacles[i])) {
        this.gameOver = true; // 게임 오버 상태로 설정
        this.restartButton.show(); // 게임 오버 시 다시 시작 버튼 표시
        break;
      }
    }

    // 목적지에 도달하면 게임 성공 처리
    if (this.distanceTraveled >= this.totalDistance) {
      this.gameOver = true;
      textSize(32);
      fill(0, 255, 0);
      textAlign(CENTER, CENTER);
      text("You Win!", width / 2, height / 2);
      this.restartButton.show();
      noLoop();
    }
  }

  display(t) { //로봇 애니메이션을 위해 변수 t 로 frameCount를 받음
    //플레이어 이미지
     imageMode(CENTER);
     fill(0, 0, 255,100);
    dodgeImgFrame = int(t/5)%2;
    image(dodgeImgRobots[dodgeImgFrame],this.player.x, this.player.y, this.player.size, this.player.size)
    ellipse(this.player.x, this.player.y, this.player.size, this.player.size);


     console.log(dodgeImgFrame);

    fill(255, 0, 0,100);
    for (let obstacle of this.obstacles) {
      //장애물 이미지
      noSmooth();
      push();
      translate(obstacle.x, obstacle.y);
      rotate(t/80*obstacle.r)
      image(dodgeImgObstacles[obstacle.i],0,0, obstacle.size,obstacle.size);
      pop();
      rectMode(CENTER)
      rect(obstacle.x,obstacle.y, obstacle.size, obstacle.size);
    } 
    imageMode(CORNER); //이미지모드 초기화
    rectMode(CORNER);//초기화
  }

  drawMiniMap() {
    let miniMapWidth = 50;
    let miniMapHeight = 200;
    let miniPlayerSize = 5;

    // 미니맵 배경
    fill(200);
    rect(width - miniMapWidth - 10, 10, miniMapWidth, miniMapHeight);

    // 주인공 위치 표시
    fill(0, 0, 255);
    let miniPlayerY = map(this.distanceTraveled, 0, this.totalDistance, 10 + miniMapHeight, 10);
    ellipse(width - miniMapWidth / 2 - 10, miniPlayerY, miniPlayerSize, miniPlayerSize);

    // 목적지 표시
    fill(0, 255, 0);
    rect(width - miniMapWidth - 10, 10, miniMapWidth, 5);
  }

  spawnObstacle() {
    let size = 80;
    let x = random(0, width - size);

    let i = int(random(0,5)) //랜덤 이미지 고르기
    let r = random(-3,3) //랜덤회전 속도
    this.obstacles.push({ x: x, y: 0, size: size , i: i, r: r});
  }

  isColliding(player, obstacle) {
    return (
      player.x < obstacle.x + obstacle.size &&
      player.x + player.size > obstacle.x &&
      player.y < obstacle.y + obstacle.size &&
      player.y + player.size > obstacle.y
    );
  }

  showRestartButton() {
    this.restartButton.show();
  }
}

function keyPressed(event) {
  if (event.code === 'ArrowLeft') {
    moveLeft = true;
  } else if (event.code === 'ArrowRight') {
    moveRight = true;
  }
}

function keyReleased(event) {
  if (event.code === 'ArrowLeft') {
    moveLeft = false;
  } else if (event.code === 'ArrowRight') {
    moveRight = false;
  }
}

