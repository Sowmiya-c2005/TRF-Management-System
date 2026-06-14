import { useState } from "react";
import API from "../services/api";

function SearchTRF() {

  const [trfNumber, setTrfNumber] = useState("");
  const [trf, setTrf] = useState(null);

  const searchTRF = async () => {

    try {

      const response = await API.get(
        `/search-trf/${trfNumber}`
      );

      setTrf(response.data);

    } catch (error) {

      alert("TRF Not Found");

    }
  };

  return (
    <div>

      <h2>Search TRF</h2>

      <input
        type="text"
        placeholder="Enter TRF Number"
        value={trfNumber}
        onChange={(e) =>
          setTrfNumber(e.target.value)
        }
      />

      <button onClick={searchTRF}>
        Search
      </button>

      <br /><br />

      {trf && (

        <div>

          <h3>TRF Details</h3>

          <p>
            <b>TRF Number:</b> {trf.trf_number}
          </p>

          <p>
            <b>Project Name:</b> {trf.project_name}
          </p>

          <p>
            <b>Created At:</b> {trf.created_at}
          </p>

        </div>

      )}

    </div>
  );
}

export default SearchTRF;