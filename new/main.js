const socket = io();
const constraints = { audio: true };
let localStream = null;

document.querySelector('#join').addEventListener('click', async () => {
  const name = document.querySelector('#name').value;
  localStream = await navigator.mediaDevices.getUserMedia(constraints);
  const audioTracks = localStream.getTracks().filter(track => track.kind === 'audio');
  socket.emit('join', { name, audioTracks });
});

socket.on('joined', data => {
  const { name } = data;
  const participantDiv = document.createElement('div');
  participantDiv.innerText = name;
  document.querySelector('#participants').appendChild(participantDiv);
});

socket.on('audio', data => {
  const { sender, audioTrack } = data;
  const audioElement = document.createElement('audio');
  audioElement.srcObject = new MediaStream([audioTrack]);
  audioElement.play();
  const participantDiv = document.querySelector(`div[data-sender="${sender}"]`);
  participantDiv.appendChild(audioElement);
});

const peerConnection = new RTCPeerConnection();

peerConnection.addEventListener('track', event => {
  const audioTrack = event.track;
  const sender = event.receiver.track;
  socket.emit('audio', { sender, audioTrack });
});

socket.on('offer', offer => {
  peerConnection.setRemoteDescription(offer);
  peerConnection.createAnswer().then(answer => {
    peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
  });
});

socket.on('answer', answer => {
  peerConnection.setRemoteDescription(answer);
});
