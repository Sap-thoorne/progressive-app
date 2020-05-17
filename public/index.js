let Peer = require('simple-peer')
let socket = io()
const video = document.querySelector('video')
let client = {}

// We try to obtain the video stream

navigator.mediaDevices.getUserMedia = (navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia || navigator.mediaDevices.msGetUserMedia);

if(navigator.mediaDevices.getUserMedia){
    navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(stream => {
        socket.emit('NewClient');
        video.srcObject = stream;
        video.play();

        // This is to initiate the stream for media exchange.
        function InitPeer(type){
            let peer = new Peer({
                initiator : (type == 'init') ? true : false,
                stream: stream,
                trickle: false
            });
            peer.on('stream', function(stream){CreateVideo(stream);});
            peer.on('close', function(){
               document.getElementById('peerVideo').remove();
               peer.destroy();
            });
        }

        function RemoveVideo(){
            document.getElementById('peerVideo').remove();
        }

        //To send an offer, initiating peer takes up the role
        function MakePeer(){
            client.gotAnswer = false;
            let peer = InitPeer('init');
            peer.on('signal', function(data){
                if(!client.gotAnswer){
                    socket.emit('Offer', data);
                }
            });
            client.peer = peer;
        }

        function FrontAnswer(offer){
            let peer = InitPeer('notInit');
            peer.on('signal', (data) => {socket.emit('Answer', data)});
            peer.signal(offer);
        }

        function SignalAnswer(answer){
            client.gotAnswer = true;
            let peer = client.peer;
            peer.signal(answer);
        }

        function CreateVideo(stream){
            let video = document.createElement('video');
            video.id = "peerVideo";
            video.srcObject = stream;
            video.class = 'embed-responsive-item';
            document.querySelector('#peerDiv').appendChild(video);
            video.play();
        }

        function SessionActive(){
            document.write("Session Active. Please come back late");
        }

        socket.on('BackOffer', FrontAnswer);
        socket.on('BackAnswer', SignalAnswer);
        socket.on('SessionActive', SessionActive);
        socket.on('CreatePeer', MakePeer);
        socket.on('RemoveVideo', RemoveVideo);

    }).catch(err => document.write(err));
}
else{
    alert('Sorry, browser does not support getUserMedia');
}
