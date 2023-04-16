// Config variables: change them to point to your own servers
const SIGNALING_SERVER_URL = 'https://voice.luova.club:8443';
const TURN_SERVER_URL = 'voice.luova.club:3478';
const TURN_SERVER_USERNAME = 'username';
const TURN_SERVER_CREDENTIAL = 'credential';
// WebRTC config: you don't have to change this for the example to work
// If you are testing on localhost, you can just use PC_CONFIG = {}
const PC_CONFIG = {
  iceServers: [
    {
      urls: 'turn:' + TURN_SERVER_URL + '?transport=tcp',
      username: TURN_SERVER_USERNAME,
      credential: TURN_SERVER_CREDENTIAL
    },
    {
      urls: 'turn:' + TURN_SERVER_URL + '?transport=udp',
      username: TURN_SERVER_USERNAME,
      credential: TURN_SERVER_CREDENTIAL
    }
  ]
};

// Signaling methods
let socket = io(SIGNALING_SERVER_URL, { autoConnect: false });

socket.on('data', (data) => {
  console.log('Data received: ',data);
  handleSignalingData(data);
});

socket.on('ready', () => {
  console.log('Ready');
  // Connection with signaling server is ready, and so is local stream
  createPeerConnection();
  sendOffer();
});

let sendData = (data) => {
  socket.emit('data', data);
};

// WebRTC methods
let pc;
let localStream;
let remoteStreamElement = document.querySelector('#remoteStream');
let localStreamElement = document.querySelector('#localStream');
let peers = [];
let connections = {};
let streams = {};

let getLocalStream = () => {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      console.log('Stream found');
      localStream = stream;
      // Disable the microphone by default
      stream.getAudioTracks()[0].enabled = false;
      localStreamElement.srcObject = localStream;
      // Connect after making sure that local stream is availble
      socket.connect();
    })
    .catch(error => {
      console.error('Stream not found: ', error);
    });
}

let createPeerConnection = (id) => {
  try {
    let pc = new RTCPeerConnection(PC_CONFIG);
    pc.onicecandidate = (event) => onIceCandidate(event, id);
    pc.ontrack = (event) => onTrack(event, id);
    pc.addStream(localStream);
    connections[id] = pc;
    console.log(`PeerConnection created for ID ${id}`);
  } catch (error) {
    console.error(`PeerConnection creation failed for ID ${id}: `, error);
  }
};

let getPeerById = (peerId) => {
  for (let i = 0; i < peers.length; i++) {
    if (peers[i].peerId === peerId) {
      return peers[i];
    }
  }
  return null;
};

let removePeer = (peer) => {
  let index = peers.indexOf(peer);
  if (index !== -1) {
    peers.splice(index, 1);
  }
};

let sendToAllPeers = (data) => {
  for (let i = 0; i < peers.length; i++) {
    sendToPeer(data, peers[i]);
  }
};

let sendToPeer = (data, peer) => {
  peer.send(JSON.stringify(data));
};

let sendOffer = (peer) => {
  console.log(`Send offer to peer ${peer}`);
  let pc = connections[peer];
  pc.createOffer().then(
    (description) => {
      pc.setLocalDescription(description).then(
        () => {
          sendMessage({ type: 'offer', data: description, from: currentPeer, to: peer });
        },
        (error) => { console.error('Set local description failed: ', error); }
      );
    },
    (error) => { console.error('Create offer failed: ', error); }
  );
};

let sendAnswer = (peer) => {
  console.log(`Send answer to peer ${peer}`);
  let pc = connections[peer];
  pc.createAnswer().then(
    (description) => {
      pc.setLocalDescription(description).then(
        () => {
          sendMessage({ type: 'answer', data: description, from: currentPeer, to: peer });
        },
        (error) => { console.error('Set local description failed: ', error); }
      );
    },
    (error) => { console.error('Create answer failed: ', error); }
  );
};

let setAndSendLocalDescription = (sessionDescription) => {
  pc.setLocalDescription(sessionDescription);
  console.log('Local description set');
  sendData(sessionDescription);
};

let onIceCandidate = (event) => {
  if (event.candidate) {
    console.log('ICE candidate');
    sendData({
      type: 'candidate',
      candidate: event.candidate
    });
  }
};

let onTrack = (event, id) => {
  console.log('Add track');

  // Create a new video element for the remote stream
  const remoteVideo = document.createElement('video');
  remoteVideo.autoplay = true;
  remoteVideo.srcObject = event.streams[0];

  // Append the video element to the HTML document
  document.body.appendChild(remoteVideo);
};

// Dictionary to store RTCPeerConnection objects for each peer
let peerConnections = {};

let handleSignalingData = (data, id) => {
  switch (data.type) {
    case 'offer':
      createPeerConnection(id);
      connections[id].setRemoteDescription(new RTCSessionDescription(data));
      sendAnswer(id);
      break;
    case 'answer':
      connections[id].setRemoteDescription(new RTCSessionDescription(data));
      break;
    case 'candidate':
      connections[id].addIceCandidate(new RTCIceCandidate(data.candidate));
      break;
  }
};
let toggleMic = () => {
  let track = localStream.getAudioTracks()[0];
  track.enabled = !track.enabled;
  let micClass = track.enabled ? "unmuted" : "muted";
  document.getElementById("toggleMic").className = micClass;
};

// Start connection
getLocalStream();
