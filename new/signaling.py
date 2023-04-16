from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

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
    emit('joined', data, broadcast=True)

@socketio.on('audio')
def handle_audio(data):
    emit('audio', data, broadcast=True)


if __name__ == '__main__':
    socketio.run(app)