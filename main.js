let shared;
let clickCount;

let totalDeg;
let guests;
let me;

function preload() {
  partyConnect(
    "wss://demoserver.p5party.org",
    "party_circle"
  );
  shared = partyLoadShared("shared", { x: 100, y: 100 });
  clickCount = partyLoadShared("clickCount", { value: 0 });
  guests = partyLoadGuestShareds();
  me = partyLoadMyShared( {degX: 0} )
}

function setup() {
  createCanvas(400, 400);
  noStroke();
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+ 장치에서는 권한 요청
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response == 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      })
      .catch(console.error);
  } else {
    // 다른 장치에서는 바로 이벤트 리스너 추가
    window.addEventListener('deviceorientation', handleOrientation);
  }

  function handleOrientation(event) {
    let alpha = event.alpha;
    let beta = event.beta;
    let gamma = event.gamma;
    // 처리 로직
  }

  if (partyIsHost()) {
    clickCount.value = 0;
    shared.x = 200;
    shared.y = 200;
  }

  totalDeg = 0;
}

function mousePressed() {
  shared.x = mouseX;
  shared.y = mouseY;
  clickCount.value++;
}

function draw() {
  background('#ffcccc');
  fill("#000066");

  me.degX = rotationX;

  for (let i = 0; i < guests.length; i++) {
    totalDeg += guests[i].degX
  }

  console.log(totalDeg);

  textAlign(CENTER, CENTER);
  text(clickCount.value, width / 2, height / 2);
  text(radians(totalDeg), width / 2, 100);

  if (keyIsPressed) {
    if (key === 'w') {
      shared.x += 0.5*radians(totalDeg);
      shared.y -= 0.5;
    } else if (key === 's') {
      shared.x += 0.5*radians(totalDeg);
      shared.y += 0.5;
    }
  }

  ellipse(shared.x, shared.y, 100, 100);

  totalDeg = 0;
}