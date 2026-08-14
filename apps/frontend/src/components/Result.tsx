import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useState,useEffect } from "react"
import { useParams } from "react-router";
interface Result{
    transcript:{type:"User"|"Assistant",content:string, createdAt:Date}[],
    score:number,
    feedback:string,
    status:"InProgress"|"Pre"|"Done"
//    Pre
//   InProgress
//   Done
}
export function Result(){
    const {interviewId}=useParams()
    const [result,setresult]=useState<Result>({
    score:0,
    feedback:'',
    transcript:[],
    status:"Pre"
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
        if(response.data.status==="Done"){
            clearInterval(intervalid)
        }

    })
    }, 5*1000);
    return ()=>{
        clearInterval(intervalid)
    }
   },[interviewId])
   return <>
{result.status=="Done"&& <div> 
    Score-{result.score} <br />
   Feedback-{result.feedback} br
   

   Transcript-{result.transcript.map(x=><div>{x.type}-{x.content}</div>)}
    </div>}
   
    </>
}