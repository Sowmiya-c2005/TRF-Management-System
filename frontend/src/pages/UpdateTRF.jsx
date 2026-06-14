import { useState } from "react";
import API from "../services/api";

function UpdateTRF() {

  const [trfNumber, setTrfNumber] = useState("");
  const [projectName, setProjectName] = useState("");

  const updateTRF = async () => {

    try {

      const response = await API.put(
        `/update-trf/${trfNumber}?project_name=${projectName}`
      );

      alert(response.data.message);

    } catch (error) {

      alert("Update Failed");

    }
  };

  return (
    <div>

      <h2>Update TRF</h2>

      <input
        type="text"
        placeholder="TRF Number"
        value={trfNumber}
        onChange={(e) => setTrfNumber(e.target.value)}
      />

      <br /><br />

      <input
        type="text"
        placeholder="New Project Name"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
      />

      <br /><br />

      <button onClick={updateTRF}>
        Update
      </button>

    </div>
  );
}

export default UpdateTRF;