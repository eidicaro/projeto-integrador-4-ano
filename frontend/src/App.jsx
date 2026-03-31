import { useEffect, useState } from "react";

function App() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/teste")
      .then(res => res.json())
      .then(data => setMsg(data.msg));
  }, []);

  return (
    <div>
      <h1>Frontend React</h1>
      <p>{msg}</p>
    </div>
  );
}

export default App;