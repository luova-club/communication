const socket = io();

document.querySelector('#join').addEventListener('click', () => {
  const name = document.querySelector('#name').value;
  socket.emit('join', { name });
});

socket.on('joined', data => {
  const { name } = data;
  const participantDiv = document.createElement('div');
  participantDiv.innerText = name;
  document.querySelector('#participants').appendChild(participantDiv);
});
