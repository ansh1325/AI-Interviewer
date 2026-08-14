import { join } from './generated/prisma/internal/prismaNamespace';
import WebSocket from "ws";
import {prisma} from './db'
import { string } from "zod";
export async function initSideband(callId:string,interviewId:string){
const url = "wss://api.openai.com/v1/realtime?call_id=" + callId;
const ws = new WebSocket(url, {
  headers: {
    Authorization: "Bearer " + process.env.OPENAI_KEY,
  },
});
const interview=await prisma.interview.findFirst({
  where:{
    id:interviewId
  }
})
ws.on("open", function open() {
  console.log("Connected to server.");

  // Send client events over the WebSocket once connected
  ws.send(
    JSON.stringify({
      type: "session.update",
      session: {
        type: "realtime",
        instructions: `You interview people based on their computer science intellect. Talk in english only.ask 2-3 questions based on their experience.this is everything about users github give you an estimated idea about what user does- ##Github Metadata ${interview?.githubMetadata}`,
      },
    })
  );
});
ws.on("message", async function incoming(message) {
  // console.log(JSON.parse(message.toString()));
  const parsedMessage=JSON.parse(message.toString());
  if(parsedMessage.type=='response.done'){
    let contents:{type:string,transcript:string}[]=[];
    parsedMessage.response.output.map(x=>x.type==='output_audio').join(' ');
    const assistantMessage = contents.filter(x => x.type === "output_audio").map(x=>x.transcript).join(" ");
    await prisma.message.create({
      data:{
        interviewId,
        type:"Assistant",
        message:assistantMessage
      }
    })

  }
})
}