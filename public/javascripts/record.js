$(() => {
  const menu = document.getElementById('inputdevices');
  const canvas = document.getElementById('visualiser');
  const canvasCtx = canvas.getContext('2d');
  let recorder;
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioCtx.createAnalyser();
  let drawVisual;
  menu.onchange = () => {
    updateSource();
  };
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    devices.forEach((device) => {
      if (device.kind == 'audioinput') {
        const item = document.createElement('option');
        item.innerHTML = device.label;
        item.value = device.deviceId;
        menu.appendChild(item);
      }
    });
  });

  $('#start-recording').click(() => {
    if (recorder.state == 'inactive') recorder.start();
  });

  $('#stop-recording').click(() => {
    if (recorder.state != 'inactive') recorder.stop();
  });

  function updateSource() {
    window.cancelAnimationFrame(drawVisual);
    const input = menu.value;
    const constraints = {
      audio: {deviceId: input ? {exact: input} : undefined},
      video: false,
    };
    console.log('device id', constraints.audio.deviceId);
    navigator.mediaDevices.getUserMedia(constraints).
        then((stream) => {
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          recorder = recorder || new MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            console.log('data available');
          };
          visualize();
        });
  }

  function visualize() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.fftSize = 2048;
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {
      drawVisual = window.requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      canvasCtx.fillStyle = 'rgb(200, 200, 200)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
      canvasCtx.beginPath();
      const sliceWidth = WIDTH * 1.0 / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * HEIGHT / 2;
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();
  }

  updateSource();
});
