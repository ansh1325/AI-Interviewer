console.log("Hello via Bun!");
import express from "express";
import { PreInterviewBody } from "./types";
import axios  from "axios";

const app=express();

app.use(express.json());

app.post("/api/v1/pre-interview",async (req,res)=>{
    const {success,data}=PreInterviewBody.safeParse(req.body)
    if(!success){
         res.status(411).json({
            message:"Incorrect Links"
        });
        return
    }
    const githubMatch = data.github.match(/github\.com\/([a-zA-Z0-9_-]+)/);
    const linkedinMatch = data.linkedin.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);

// 2. Extract the username from the match array (fallback to null if it fails)
    const githubUsername = githubMatch ? githubMatch[1] : null;
    const linkedinUsername = linkedinMatch ? linkedinMatch[1] : null;

    const userRepos=await axios.get(`https://api.github.com/users/${githubUsername}/repos`);
    const filteredUserRepos=userRepos.data.map((x:any)=>({
        description:x.description,
        name:x.name,
        fullname:x.full_name,
        starCount:x.stargazers_count

    }))
})
app.listen(3001);