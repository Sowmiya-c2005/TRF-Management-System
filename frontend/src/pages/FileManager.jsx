import { useState } from "react";
import API from "../services/api";

function FileManager() {

  const [trfNumber, setTrfNumber] = useState("");
  const [folderName, setFolderName] = useState("");
  const [files, setFiles] = useState([]);

  const getFiles = async () => {

    try {

      const response = await API.get(
        `/files/${trfNumber}/${folderName}`
      );

      setFiles(response.data.files);

    } catch (error) {

      alert("Unable to fetch files");

    }
  };
  const deleteFile = async (fileName) => {

  try {

    await API.delete(
      `/delete-file/${trfNumber}/${folderName}/${fileName}`
    );

    alert("File Deleted Successfully");

    getFiles();

  } catch (error) {

    alert("Delete Failed");

  }
};
  return (
    <div>

      <h2>File Manager</h2>

      <input
        type="text"
        placeholder="TRF Number"
        value={trfNumber}
        onChange={(e) => setTrfNumber(e.target.value)}
      />

      <br /><br />

      <input
        type="text"
        placeholder="Folder Name"
        value={folderName}
        onChange={(e) => setFolderName(e.target.value)}
      />

      <br /><br />

      <button onClick={getFiles}>
        Get Files
      </button>

      <br /><br />

      <ul>
  {files.map((file, index) => (
    <li key={index}>

      {file}

      <button
        onClick={() =>
          window.open(
            `http://127.0.0.1:8000/download-file/${trfNumber}/${folderName}/${file}`
          )
        }
      >
        Download
      </button>
      <button
  onClick={() => deleteFile(file)}
>
  Delete
</button>
    </li>
  ))}
</ul>

    </div>
  );
}

export default FileManager;