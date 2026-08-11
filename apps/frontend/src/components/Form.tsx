import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "@/components/ui/button";
// import { toast } from "@/components/ui/toast"
import { toast } from "sonner"
// Add this line instead
import axios from "axios";

import { Toaster } from "@/components/ui/sonner"

import { BACKEND_URL } from "@/lib/config";
import { useNavigate } from "react-router";

export function Form(){
  const [github,setgithub]=useState("")
  const [loading,setloading]=useState(false)
  const navigate=useNavigate()
  // const [linkedin,setlinkedin]=useState("")
  async function onsubmit(){
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/;
    // const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;
    if(!github || !githubRegex.test(github)){
      
      toast("Please Provide valid github urls")
      return
    }
    try {
      const response=await axios.post(`${BACKEND_URL}/api/v1/pre-interview`,{
        github
      })
      navigate(`/interview/${response.data.id}`);
    } catch (e: any) {
      console.error(e);
      toast("Error starting interview. Please check if the backend is running.");
    } finally {
      setloading(false);
    }
  }
    return <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto">
      <div>
        <h2 className="text-3xl font-bold mb-6 text-black">Ai Interviewer</h2>
        {/* <div className="p-4">
          <Input placeholder="Linkedin URL" onChange={e=>setlinkedin(e.target.value)} />
          
        </div> */}
        <div className="p-4"> 
          <Input placeholder="Github URL" onChange={e=>setgithub(e.target.value)} />  
        </div>
        <div className="flex justify-center p-4">
          <Button disabled={loading} onClick={onsubmit}>{loading?"Starting Interview...":"Start Interview"}</Button>
        </div>
      </div>
    </div>
}