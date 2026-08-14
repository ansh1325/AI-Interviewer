import { BACKEND_URL } from "@/lib/config";
import { useEffect ,useRef} from "react"
import { useParams } from "react-router"
import { DeepgramClient } from "@deepgram/sdk";
import axios from "axios";
const client = new DeepgramClient();

export function Interview(){

    const { interviewId }=useParams();

    const audioRef=useRef<HTMLAudioElement>(null)
    useEffect(()=>{
       (async ()=>{
        const pc = new RTCPeerConnection();

// Set up to play remote audio from the model
audioRef.current = document.createElement("audio");
audioRef.current.autoplay = true;
pc.ontrack = (e) => (audioRef.current!.srcObject = e.streams[0]!);

// Add local audio track for microphone input in the browser
const ms = await navigator.mediaDevices.getUserMedia({
  audio: true,
});

// const connection = await client.listen.v1.connect({
//   Authorization:"ee3a19271e7917711c674dca557210f0b86d7d0d",
//   model: "nova-3",
//   language: "en",
//   punctuate: "true",
//   interim_results: "true",
// });
const socket=new WebSocket('wss://api.deepgram.com/v1/listen',[
  'token',
  'ee3a19271e7917711c674dca557210f0b86d7d0d'
])
socket.onopen=()=>{

const mediRecorder=new MediaRecorder(ms,{mimeType:'audio/webm'});
mediRecorder.start(250)

mediRecorder.addEventListener("dataavailable",(event)=>{
  socket.send(event.data)
})
}
socket.onmessage=(message)=>{
  const received=JSON.parse(message.data)
  const transcript=received.channel.alternatives[0].transcript;
  if(transcript){
    console.log(transcript)
    axios.post(`${BACKEND_URL}/api/v1/session/user/${interviewId}`,{
      message:transcript
    })
  }
}
 pc.addTrack(ms.getTracks()[0]!);

// // Set up data channel for sending and receiving events
// // const dc = pc.createDataChannel("oai-events ");

// // Start the session using the Session Description Protocol (SDP)
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

const sdpResponse = await fetch(`${BACKEND_URL}/api/v1/session/${interviewId}`, {
  method: "POST",
  body: offer.sdp,
  headers: {
    "Content-Type": "application/sdp",
  },
});
console.log("hello")

const answer = {
  type: "answer" as 'answer',
  sdp: await sdpResponse.text(),
};
await pc.setRemoteDescription(answer);

       })() 

        // Create a peer connection
    },[interviewId])
return <>
<audio src="" autoPlay ref={audioRef}></audio>
    </>
}