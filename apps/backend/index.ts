import { id } from './../../node_modules/.bun/effect@3.20.0/node_modules/effect/src/Fiber';
console.log("Hello via Bun!");
import express from "express";
import { PreInterviewBody } from "./types";
import axios  from "axios";
import { scrapegithub } from "./scrapers/github";
import cors from 'cors'
import {prisma} from "./db"
const app=express();

app.use(express.json());
app.use(cors())
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
app.listen(3001);