$(() => {
  updateRecordings();
  function updateRecordings() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/recordings', true);
    xhr.onload = function() {
      if (xhr.status == 200) {
        showRecordings(JSON.parse(xhr.response));
      } else {
        alert('Could not retrieve recordings from service.');
      }
    };

    xhr.send();
  }

  function showRecordings(recordings) {
    recordings.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    const menu = document.getElementById('menu-recordings');
    menu.innerHTML = '';
    for (const recording of recordings) {
      const a = document.createElement('a');
      a.classList.add('dropdown-item');
      a.href = '/results/' + recording._id;
      a.innerHTML = 'Recording ' + new Date(recording.date).toGMTString();
      menu.appendChild(a);
    }
  }
});
