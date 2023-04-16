from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
from collections import defaultdict

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')
participants = defaultdict(dict)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/main.js")
def main():
    with open("main.js", "r") as f:
        return f.read()


@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('join')
def handle_join(data):
    name = data['name']
    audioTracks = data['audioTracks']
    participants[request.sid]['name'] = name
    participants[request.sid]['audioTrack'] = audioTracks[0]
    for sid, participant in participants.items():
        if sid != request.sid:
            if participant['audioTrack'] is not None:
                receiver = peerConnection.addTransceiver('audio')
                participant['receivers'].append(receiver)
                sender = receiver.sender
                participant['senders'].append(sender)
                offer = peerConnection.createOffer()
                sender.createOffer().then(offer => {
                    sender.setLocalDescription(offer);
                    socketio.emit('offer', offer, room=sid)
                });

@socketio.on('audio')
def handle_audio(data):
    sender = data['sender']
    audioTrack = data['audioTrack']
    for sid, participant in participants.items():
        if sid != request.sid and sender in participant['senders']:
            participant['receivers'][participant['senders'].index(sender)].track = audioTrack

if __name__ == '__main__':
    socketio.run(app)