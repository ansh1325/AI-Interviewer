console.log("Hello via Bun!");
import express from "express";
import { PreInterviewBody } from "./types";
import axios  from "axios";
import { scrapegithub } from "./scrapers/github";
import cors from 'cors'
import {prisma} from "./db"
import { initSideband } from "./sideband";
const app=express();

app.use(express.json());
app.use(cors())
app.use(express.text({ type: ["application/sdp", "text/plain"] }));

app.post("/api/v1/pre-interview",async (req,res)=>{
    const {success,data}=PreInterviewBody.safeParse(req.body)
    if(!success){
         res.status(411).json({
            message:"Incorrect Links"
        });
        return
    }
    const githubMatch = data.github.match(/github\.com\/([a-zA-Z0-9_-]+)/);
    // const linkedinMatch = data.linkedin.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);

// 2. Extract the username from the match array (fallback to null if it fails)
    const githubUsername = githubMatch ? githubMatch[1] : null;
    if (!githubUsername) {
    return res.status(400).json({ message: "Invalid GitHub URL provided" });
  }
    // const linkedinUsername = linkedinMatch ? linkedinMatch[1] : null;

    const githubdata=await scrapegithub(githubUsername)

    const interview=await prisma.interview.create({
        data:{
            githubMetadata:JSON.stringify(githubdata),
            status:"Pre"
        }
    })
    res.json({id:interview.id})
    
})

app.post("/api/v1/session/:interviewId",async (req,res)=>{
    const sessionConfig = JSON.stringify({
  type: "realtime",
  model: "gpt-realtime-2.1",
  audio: { output: { voice: "marin" } },
});

  const fd = new FormData();
  fd.set("sdp", req.body);
  fd.set("session", sessionConfig);

  try {
    const r = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        "OpenAI-Safety-Identifier": "hashed-user-id",
      },
      body: fd,
    });

    const location = r.headers.get("Location");
const callId = location?.split("/").pop()!;
console.log(callId);
    // Send back the SDP we received from the OpenAI REST API
    const sdp = await r.text();
    res.send(sdp);
    initSideband(callId,req.params.interviewId)
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
})

app.post("/api/v1/session/user/response/:interviewId",async (req,res)=>{
const {message}=req.body;
await prisma.message.create({
  data:{
    interviewId:req.params.interviewId!,
    type:'User',
    message:message
  }
})
})
app.listen(3001);