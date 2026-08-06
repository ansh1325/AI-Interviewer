import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "@/components/ui/button";
// import { toast } from "@/components/ui/toast"
import { toast } from "sonner"
// Add this line instead
import axios from "axios";

import { Toaster } from "@/components/ui/sonner"

import { BACKEND_URL } from "@/lib/config";

export function Form(){
  const [github,setgithub]=useState("")
  // const [linkedin,setlinkedin]=useState("")
  async function onsubmit(){
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/;
    // const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;
    if(!github || !githubRegex.test(github)){
      
      toast("Please Provide valid github urls")
    }
    await axios.post(`${BACKEND_URL}/api/v1/pre-interview`,{

      github
    })
  }
    return <div className="h-screen v-screen justify-center items-center">
      <div>
        <h2>Ai Interviewer</h2>
        {/* <div className="p-4">
          <Input placeholder="Linkedin URL" onChange={e=>setlinkedin(e.target.value)} />
          
        </div> */}
        <div className="p-4"> 
          <Input placeholder="Github URL" onChange={e=>setgithub(e.target.value)} />  
        </div>
        <div className="flex justify-center p-4">
          <Button onClick={onsubmit}>Start Interview</Button>
        </div>
      </div>
    </div>
}