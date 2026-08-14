import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useState,useEffect } from "react"
import { useParams } from "react-router";
interface Result{
    transcript:{type:"User"|"Assistant",content:string, createdAt:Date}[],
    score:number,
    feedback:string,
   
}
export function Result(){
    const {interviewId}=useParams()
    const [result,setresult]=useState<Result>({
    score:0,
    feedback:'',
    transcript:[]
   });
   useEffect(()=>{
axios.get(`${BACKEND_URL}/api/v1/result/${interviewId}`)
    .then(response=>{
        setresult(response.data);

    })
    let intervalid=setInterval(() => {
        axios.get(`${BACKEND_URL}/api/v1/result/${interviewId}`)
    .then(response=>{
        setresult(response.data);

    })
    }, 5*1000);
    return ()=>{
        clearInterval(intervalid)
    }
   },[interviewId])
   return <>

   Score-{result.score}
   Feedback-{result.feedback}

   Transcript-{result.transcript.sort((a,b)=>a.createdAt.getTime()-b.createdAt.getTime()).map(x=><div>{x.type}-{x.content}</div>)}
   
    </>
}