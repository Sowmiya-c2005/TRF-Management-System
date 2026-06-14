import { useState } from "react";
import API from "../services/api";

function CreateTRF() {

  const [trfNumber, setTrfNumber] = useState("");
  const [projectName, setProjectName] = useState("");

  const createTRF = async () => {

    try {

      const response = await API.post("/create-trf", {
        trf_number: trfNumber,
        project_name: projectName
      });

      alert(response.data.message);

    } catch (error) {

      alert("Error Creating TRF");

    }
  };

  return (
    <div>

      <h2>Create TRF</h2>

      <input
        type="text"
        placeholder="TRF Number"
        value={trfNumber}
        onChange={(e) => setTrfNumber(e.target.value)}
      />

      <br /><br />

      <input
        type="text"
        placeholder="Project Name"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
      />

      <br /><br />

      <button onClick={createTRF}>
        Create TRF
      </button>

    </div>
  );
}

export default CreateTRF;