let Peer = require('simple-peer')
let socket = io()
const video = document.querySelector('video')
let client = {}


//buttons
micBtn=document.getElementById("mic-btn")
videoBtn=document.getElementById("video-btn")



//get stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {

        recorder = new MediaRecorder(stream);
        socket.emit('NewClient')
        video.srcObject = stream
        video.play()
        

        //button listeners

        videoBtn.onclick = function (){

            if (stream.getVideoTracks()[0].enabled) {    
                stream.getVideoTracks()[0].enabled = false;
                videoBtn.firstChild.name="videocam-outline";
            }
        
            else {
                stream.getVideoTracks()[0].enabled = true;
                videoBtn.firstChild.name="videocam-off-outline";
            }
        
            };

        micBtn.onclick = function (){
            if(stream.getAudioTracks()[0].enabled){
                stream.getAudioTracks()[0].enabled = false;
                micBtn.firstChild.name = "mic-outline";
            }
            else{
                stream.getAudioTracks()[0].enabled = true;
                micBtn.firstChild.name="mic-off-outline";
            }
        }

       
        //used to initialize a peer
        function InitPeer(type) {
            let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: stream, trickle: false })
            peer.on('stream', function (stream) {
                CreateVideo(stream);
                document.getElementById('peerVideo').play();
            })
            peer.on('close', function () {
                document.getElementById("peerVideo").remove();
                peer.destroy()
            })
            return peer
        }


        //for peer of type init
        function MakePeer() {
            client.gotAnswer = false
            let peer = InitPeer('init')
            peer.on('signal', function (data) {
                if (!client.gotAnswer) {
                    socket.emit('Offer', data)
                }
            })
            client.peer = peer
        }

        //for peer of type not init
        function FrontAnswer(offer) {
            let peer = InitPeer('notInit')
            peer.on('signal', (data) => {
                socket.emit('Answer', data)
            })
            peer.signal(offer)
        }

        function SignalAnswer(answer) {
            client.gotAnswer = true
            let peer = client.peer
            peer.signal(answer)
        }

        function CreateVideo(stream) {
            let video = document.getElementById('peerVideo')
            video.srcObject = stream,
            err => console.error(err)

        }

        function SessionActive() {
            document.write('Session Active. Please come back later')
        }

        socket.on('BackOffer', FrontAnswer)
        socket.on('BackAnswer', SignalAnswer)
        socket.on('SessionActive', SessionActive)
        socket.on('CreatePeer', MakePeer)

    })
    .catch(err => document.write(err))

    