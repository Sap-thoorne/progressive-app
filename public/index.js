let Peer = require('simple-peer');
let socket = io();
const video = document.querySelector('video');
// const filter = document.querySelector('#theme');
let client = {};
// let currentfilter;

// We try to obtain the video stream

navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(stream => {
    socket.emit('NewClient');
    video.srcObject = stream;
    video.play();

    // This is to initiate the stream for media exchange.
    // filter.addEventListener('change', (event)=>{
    //    currentFilter = event.target.value;
    //    video.style.filter = currentFilter;
    //    SendFilter(currentFilter);
    //    event.preventDefault;
    // });

    function InitPeer(type){
        let peer = new Peer({
            initiator : (type == 'init') ? true : false,
            stream: stream,
            trickle: false
        });
        peer.on('stream', function(stream){CreateVideo(stream);});
        // peer.on('close', function(){
        //    document.getElementById('peerVideo').remove();
        //    peer.destroy();
        // });
        // peer.on('data', function (data) {
        //     let decodedData = new TextDecoder('utf-8').decode(data);
        //     let peervideo = document.querySelector('#peerVideo');
        //     peervideo.style.filter = decodedData;
        // })
        // return peer;
    }

    // function RemoveVideo(){
    //     document.getElementById('peerVideo').remove();
    // }

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
        client.peer = peer;
    }

    function SignalAnswer(answer){
        client.gotAnswer = true;
        let peer = client.peer;
        peer.signal(answer);
    }

    function CreateVideo(stream){
        let video = document.createElement('video');
        video.setAttribute('id', 'peerVideo');
        video.srcObject = stream;
        video.setAttribute('class', 'embed-responsive-item');
        console.log("Came Here" + video);
        // video.class = 'embed-responsive-item';
        document.getElementById('peerDiv').appendChild(video);
        video.play();
    }

    function SessionActive(){
        document.write("Session Active. Please come back late");
    }

    function RemovePeer() {
        document.getElementById("peerVideo").remove();
        // document.getElementById("muteText").remove();
        if (client.peer) {
            client.peer.destroy()
        }
    }

    socket.on('BackOffer', FrontAnswer);
    socket.on('BackAnswer', SignalAnswer);
    socket.on('SessionActive', SessionActive);
    socket.on('CreatePeer', MakePeer);
    socket.on('Disconnect', RemovePeer);

}).catch(err => document.write(err));
