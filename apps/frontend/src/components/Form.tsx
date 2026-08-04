import { Input } from "../components/ui/input";
import { Button } from "@/components/ui/button";


export function Form(){
    return <div className="h-screen v-screen justify-center items-center">
      <div>
        <h2>Ai Interviewer</h2>
        <div className="p-4">
          <Input placeholder="Linkedin URL" />
          
        </div>
        <div className="p-4"> 
          <Input placeholder="Github URL" />  
        </div>
        <div className="flex justify-center p-4">
          <Button>Start Interview</Button>
        </div>
      </div>
    </div>
}