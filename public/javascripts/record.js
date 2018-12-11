$(() => {
  const menu = document.getElementById('inputdevices');
  const canvas = document.getElementById('visualiser');
  const canvasCtx = canvas.getContext('2d');
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioCtx.createAnalyser();
  let recorder;
  let source;
  menu.onchange = () => {
    updateSource();
  };
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    devices.forEach((device) => {
      if (device.kind === 'audioinput') {
        const item = document.createElement('option');
        item.innerHTML = device.label;
        item.value = device.deviceId;
        menu.appendChild(item);
      }
    });
    updateSource();
  });

  $('#toggle-recording').click(function() {
    if (recorder.state === 'inactive') {
      $(this).html($(this).html().replace($(this).text(), 'Stop'));
      recorder.start();
    } else {
      $(this).html($(this).html().replace($(this).text(), 'Record'));
      recorder.stop();
    }
  });

  /**
   * Use selected audio input device and forward stream to
   * recorder and visualizer
   */
  function updateSource() {
    const input = menu.value;
    const constraints = {
      audio: {deviceId: input ? {exact: input} : undefined},
      video: false,
    };

    navigator.mediaDevices.getUserMedia(constraints).
        then((stream) => {
          if (source) source.disconnect(analyser);
          source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          recorder = new MediaRecorder(stream);
          recorder.ondataavailable = recordingHandler;
          initOscilloscope();
        });
  }

  /**
   * Start visualizing analyzer data with oscilloscope
   */
  function initOscilloscope() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.fftSize = 2048;
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    /**
     * Draw to canvas
     */
    function draw() {
      window.requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      canvasCtx.fillStyle = recorder.state === 'inactive' ?
          '#6c757d' :
          '#da3a4a';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = recorder.state === 'inactive' ?
          '#aab3bb' :
          '#ffffff';
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
    }

    draw();
  }

  /**
   * Send recording to API
   * @param {event} e ondataavailable event
   */
  function recordingHandler(e) {
    disableRecButton();
    console.log('data', e.data);
    console.log('data size ', bytesToSize(e.data.size));
    const formData = new FormData();
    formData.append('recording', e.data);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload/recording', true);
    xhr.onload = function(ev) {
      const id = JSON.parse(xhr.response).recording_id;
      getResults(id);
      enableRecButton();
    };
    xhr.upload.addEventListener('progress', updateProgress);
    xhr.upload.addEventListener('load', transferComplete);
    xhr.upload.addEventListener('error', transferFailed);
    xhr.upload.addEventListener('abort', transferCanceled);
    xhr.send(formData);

    function updateProgress(ev) {
      if (ev.lengthComputable) {
        const complete = ev.loaded / ev.total * 100;
        console.log('uploaded ' + complete.toFixed(2) + ' %');
      }
    }

    function transferComplete(ev) {
      console.log('transfer complete');
    }

    function transferFailed(ev) {
      console.log('transfer failed');
    }

    function transferCanceled(ev) {
      console.log('transfer canceled');
    }

    /**
     * @param {number} bytes
     * @return {string} String representation of the size
     */
    function bytesToSize(bytes) {
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) return '0 Byte';
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }
  }

  function getResults(id) {
    window.location.replace(window.location.origin + '/results/' + id);
  }

  function disableRecButton() {
    $('#toggle-recording').prop('disabled', true);

    $('#icon-spinner').attr('hidden', false);
    $('#icon-rec').attr('hidden', true);
  }

  function enableRecButton() {
    $('toggle-recording').prop('disabled', false);
    $('#icon-spinner').attr('hidden', true);
    $('#icon-rec').attr('hidden', false);
  }
});
