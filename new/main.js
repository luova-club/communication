const socket = io();
const constraints = { audio: true };
let localStream = null;

document.querySelector('#join').addEventListener('click', async () => {
  const name = document.querySelector('#name').value;
  localStream = await navigator.mediaDevices.getUserMedia(constraints);
  socket.emit('join', { name });
});

socket.on('joined', data => {
  const { name } = data;
  const participantDiv = document.createElement('div');
  participantDiv.innerText = name;
  document.querySelector('#participants').appendChild(participantDiv);
  localStream.getTracks().forEach(track => {
    const sender = peerConnection.addTrack(track, localStream);
  });
});

const peerConnection = new RTCPeerConnection();

peerConnection.addEventListener('track', event => {
  const audioElement = document.createElement('audio');
  audioElement.srcObject = event.streams[0];
  document.querySelector('#participants').appendChild(audioElement);
  const receiver = peerConnection.addTrack(event.track, localStream);
  socket.emit('audio', { receiver });
});

socket.on('audio', data => {
  const { receiver } = data;
  peerConnection.getSenders().forEach(sender => {
    if (sender.track.kind === 'audio') {
      sender.replaceTrack(receiver);
    }
  });
});