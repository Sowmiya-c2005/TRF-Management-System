import { useState } from "react";
import API from "../services/api";

function UploadFile() {

  const [trfNumber, setTrfNumber] = useState("");
  const [folderName, setFolderName] = useState("");
  const [file, setFile] = useState(null);

  const uploadFile = async () => {

    const formData = new FormData();

    formData.append("file", file);

    try {

      const response = await API.post(
        `/upload-file/${trfNumber}/${folderName}`,
        formData
      );

      alert(response.data.message);

    } catch (error) {

      alert("Upload Failed");

    }
  };

  return (
    <div>

      <h2>Upload File</h2>

      <input
        type="text"
        placeholder="TRF Number"
        value={trfNumber}
        onChange={(e) =>
          setTrfNumber(e.target.value)
        }
      />

      <br /><br />

      <input
        type="text"
        placeholder="Folder Name"
        value={folderName}
        onChange={(e) =>
          setFolderName(e.target.value)
        }
      />

      <br /><br />

      <input
        type="file"
        onChange={(e) =>
          setFile(e.target.files[0])
        }
      />

      <br /><br />

      <button onClick={uploadFile}>
        Upload
      </button>

    </div>
  );
}

export default UploadFile;