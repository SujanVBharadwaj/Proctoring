let loudSoundDetected = false;
let loudSoundThreshold = 85;
let loudSoundDuration = 10000;
let violations = [];
let screenshots = [];
let mouseInactiveTime = 0;
let mouseMovementCounter = 0;
let mouseMovementThreshold = 50;
let isTestRunning = false;
let stream = null;
let lastMouseMoveTime = Date.now();
let videoCheckInterval, mouseInactivityInterval;
let lastViolationTime = 0;
const violationCooldown = 1000;
let originalWindowWidth = window.innerWidth;
let originalWindowHeight = window.innerHeight;
const setupPanel = document.getElementById('setup-panel');
const cameraPermission = document.getElementById('camera-permission');
const cameraPreview = document.getElementById('camera-preview');
const setupWebcam = document.getElementById('setup-webcam');
const testArea = document.getElementById('test-area');
const resultsArea = document.getElementById('results');
const violationsDiv = document.getElementById('violations');
const violationLog = document.getElementById('violation-log');
const statusSpan = document.getElementById('status');
const startButton = document.getElementById('start-test');
const endButton = document.getElementById('end-test');
const resetButton = document.getElementById('reset');
const activityIndicator = document.getElementById('activity-indicator');
const webcamFeed = document.getElementById('webcam-feed');
const latestScreenshot = document.getElementById('latest-screenshot');
const faceStatus = document.getElementById('face-status');
const peopleCount = document.getElementById('people-count');
const micIndicator = document.getElementById('mic-indicator');

let pose;

cameraPermission.addEventListener('click', requestCameraAccess);
startButton.addEventListener('click', startTest);
endButton.addEventListener('click', endTest);
resetButton.addEventListener('click', resetTest);
document.addEventListener('mousemove', handleMouseMove);

async function requestCameraAccess() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setupWebcam.srcObject = stream;
    webcamFeed.srcObject = stream;
    cameraPermission.classList.add('hidden');
    cameraPreview.classList.remove('hidden');
    startButton.disabled = false;
    startMicMonitoring(stream);

    pose = new Pose.Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    await pose.initialize();
  } catch (err) {
    alert("Camera and microphone access are required.");
    console.error("Access error:", err);
  }
}

function startMicMonitoring(stream) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  function checkMicVolume() {
    analyser.getByteFrequencyData(dataArray);
    const avgVolume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    micIndicator.style.backgroundColor = avgVolume > 15 ? (avgVolume > 50 ? 'red' : 'orange') : 'gray';

    if (avgVolume > 50) {
      recordViolation("Loud Sound", "Excessive noise detected");
    }
    requestAnimationFrame(checkMicVolume);
  }

  checkMicVolume();
}

function takeScreenshot() {
  if (!stream) return;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = webcamFeed.videoWidth;
  canvas.height = webcamFeed.videoHeight;
  context.drawImage(webcamFeed, 0, 0, canvas.width, canvas.height);
  const screenshot = {
    timestamp: new Date().toLocaleTimeString(),
    dataUrl: canvas.toDataURL('image/jpeg', 0.7)
  };
  screenshots.push(screenshot);
  latestScreenshot.src = screenshot.dataUrl;
  return canvas;
}

async function checkForPose() {
  try {
    const overlayCanvas = document.getElementById('face-overlay');
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    const results = await pose.send({ image: webcamFeed });

    const landmarks = results.poseLandmarks || [];

    if (landmarks.length > 0) {
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 3;
      landmarks.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x * overlayCanvas.width, point.y * overlayCanvas.height, 5, 0, 2 * Math.PI);
        ctx.stroke();
      });

      faceStatus.textContent = "Pose Detected";
      peopleCount.textContent = "1";

    } else {
      faceStatus.textContent = "No Person";
      peopleCount.textContent = "0";
      recordViolation("No Person Detected", "No user detected in camera");
    }
  } catch (error) {
    console.error("Pose detection error:", error);
  }
}

function startVideoMonitoring() {
  videoCheckInterval = setInterval(checkForPose, 3000);
}

function recordViolation(type, details) {
  const now = Date.now();
  if (now - lastViolationTime < violationCooldown) return;
  lastViolationTime = now;

  const timestamp = new Date().toLocaleTimeString();
  const violation = { timestamp, type, details };
  takeScreenshot();
  violations.push(violation);

  const violationElement = document.createElement('p');
  violationElement.innerHTML = `<strong>${timestamp}:</strong> ${type} - ${details}`;
  violationsDiv.appendChild(violationElement);

  statusSpan.textContent = "Violation Detected";
  statusSpan.className = "warning";

  setTimeout(() => {
    statusSpan.textContent = "Normal";
    statusSpan.className = "";
  }, 3000);

  if (violations.length >= 6 && isTestRunning) {
    alert("Too many violations. Test will end.");
    endTest();
  }
}

function handleMouseMove() {
  if (!isTestRunning) return;
  mouseInactiveTime = 0;
  mouseMovementCounter += 0.3;
  lastMouseMoveTime = Date.now();
  updateActivityIndicator();
}

function startMouseActivityDecay() {
  mouseActivityInterval = setInterval(() => {
    if (!isTestRunning) return;
    const now = Date.now();
    const timeSinceMove = now - lastMouseMoveTime;

    if (timeSinceMove > 500) {
      mouseMovementCounter = Math.max(0, mouseMovementCounter - 0.5);
      updateActivityIndicator();
    }
  }, 300);
}

function updateActivityIndicator() {
  const activityLevel = Math.min((mouseMovementCounter / mouseMovementThreshold) * 100, 100);
  activityIndicator.style.width = `${activityLevel}%`;

  if (activityLevel > 80) {
    activityIndicator.style.backgroundColor = '#F44336';
    if (isTestRunning) {
      recordViolation("Unusual Mouse Activity", "Mouse activity extremely high");
      endTest();
    }
  } else if (activityLevel > 50) {
    activityIndicator.style.backgroundColor = '#FF9800';
  } else {
    activityIndicator.style.backgroundColor = '#2196F3';
  }
}

function startMouseInactivityTracking() {
  mouseInactivityInterval = setInterval(() => {
    mouseInactiveTime++;
    if (mouseInactiveTime >= 60) {
      recordViolation("Mouse Inactivity", "No mouse movement for 60 seconds");
      mouseInactiveTime = 0;
    }
  }, 1000);
}

function preventCheating() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isTestRunning) {
      recordViolation("Tab Switch", "Switched tabs or minimized window");
    }
  });
  document.addEventListener('contextmenu', e => {
    if (isTestRunning) {
      e.preventDefault();
      recordViolation("Context Menu", "Right click detected");
    }
  });
  document.addEventListener('keydown', e => {
    if (!isTestRunning) return;
    if ((e.ctrlKey && (e.key === 'c' || e.key === 'v')) || (e.altKey && e.key.toLowerCase() === 'tab') || (e.key === 'F12') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i')) {
      recordViolation("Keyboard Shortcut", `Shortcut pressed: ${e.key}`);
    }
  });
  window.addEventListener('blur', () => {
    if (isTestRunning) {
      recordViolation("Window Blur", "Window lost focus");
    }
  });
  window.addEventListener('resize', () => {
    if (isTestRunning) {
      const widthChange = Math.abs(window.innerWidth - originalWindowWidth) / originalWindowWidth;
      const heightChange = Math.abs(window.innerHeight - originalWindowHeight) / originalWindowHeight;
      if (widthChange > 0.2 || heightChange > 0.2) {
        recordViolation("Window Resize", "Window resized");
      }
    }
  });
}

function checkMicActivityForViolation() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  function checkMicVolumeForViolation() {
    analyser.getByteFrequencyData(dataArray);
    const avgVolume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;

    if (avgVolume > loudSoundThreshold) {
      if (!loudSoundDetected) {
        loudSoundDetected = true;
        setTimeout(() => {
          if (loudSoundDetected) {
            recordViolation("Loud Sound Detected", "Continuous loud noise");
          }
          loudSoundDetected = false;
        }, loudSoundDuration);
      }
    }
  }

  setInterval(checkMicVolumeForViolation, 1000);
}

function startTest() {
  isTestRunning = true;
  violations = [];
  screenshots = [];
  setupPanel.classList.add('hidden');
  testArea.classList.remove('hidden');
  resultsArea.classList.add('hidden');

  startMouseInactivityTracking();
  startVideoMonitoring();
  startMouseActivityDecay();
  preventCheating();
  checkMicActivityForViolation();
  takeScreenshot();
  alert("Test started. You are now being monitored.");
}

function endTest() {
  isTestRunning = false;
  clearInterval(mouseInactivityInterval);
  clearInterval(videoCheckInterval);
  if (stream) stream.getTracks().forEach(track => track.stop());

  testArea.classList.add('hidden');
  resultsArea.classList.remove('hidden');

  violationLog.innerHTML = violations.length ? violations.map(v => `<p><strong>${v.timestamp}:</strong> ${v.type} - ${v.details}</p>`).join('') : "<p>No violations detected during the test.</p>";
}

function resetTest() {
  location.reload();
}
