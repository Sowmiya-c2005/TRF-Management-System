import { useEffect, useState } from "react";
import API from "../services/api";
import { DataGrid } from "@mui/x-data-grid";
function AllTRFs() {

  const [trfs, setTrfs] = useState([]);

  useEffect(() => {
    fetchTRFs();
  }, []);

  const fetchTRFs = async () => {

    try {

      const response = await API.get("/all-trfs");

      setTrfs(response.data);

    } catch (error) {

      console.log(error);

    }
  };
  const deleteTRF = async (trfNumber) => {

  try {

    await API.delete(
      `/delete-trf/${trfNumber}`
    );

    alert("TRF Deleted Successfully");

    fetchTRFs();

  } catch (error) {

    alert("Error Deleting TRF");

  }
};
  const columns = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "trf_number", headerName: "TRF Number", width: 200 },
  { field: "project_name", headerName: "Project Name", width: 250 },
  { field: "created_at", headerName: "Created At", width: 250 }
];

  return (
    <div>

      <h2>All TRFs</h2>

      <table border="1" cellPadding="10">

        <div style={{ height: 500, width: "100%" }}>
  <DataGrid
    rows={trfs}
    columns={columns}
    pageSize={5}
    rowsPerPageOptions={[5, 10, 20]}
  />
</div>

      </table>

    </div>
  );
}

export default AllTRFs;