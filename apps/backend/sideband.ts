import WebSocket from "ws";
export function initSideband(callId:string,interviewId:String){
const url = "wss://api.openai.com/v1/realtime?call_id=" + callId;
const ws = new WebSocket(url, {
  headers: {
    Authorization: "Bearer " + process.env.OPENAI_KEY,
  },
});

ws.on("open", function open() {
  console.log("Connected to server.");

  // Send client events over the WebSocket once connected
  ws.send(
    JSON.stringify({
      type: "session.update",
      session: {
        type: "realtime",
        instructions: "You interview people based on their computer science intellect",
      },
    })
  );
});
ws.on("message", function incoming(message) {
  console.log(JSON.parse(message.toString()));
})
}