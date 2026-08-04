import { useState } from "react";
import { Form } from "./components/Form";
import { Interview } from "./components/Interview";
import { Result } from "./components/Result"; // 👈 Explicitly added the import path

export function App() {
  const [page, setpage] = useState<"form" | "result" | "interview">("form");

  return (
    <div className="h-screen w-screen flex justify-center items-center">
      {page === "form" && <Form />}
      {page === "interview" && <Interview />}
      {page === "result" && <Result />}
    </div>
  );
}

export default App;
