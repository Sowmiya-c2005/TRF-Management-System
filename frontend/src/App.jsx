import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import CreateTRF from "./pages/CreateTRF";
import SearchTRF from "./pages/SearchTRF";
import AllTRFs from "./pages/AllTRFs";
import UploadFile from "./pages/UploadFile";
import FileManager from "./pages/FileManager";
import UpdateTRF from "./pages/UpdateTRF";
function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateTRF />} />
          <Route path="/search" element={<SearchTRF />} />
          <Route path="/all" element={<AllTRFs />} />
          <Route path="/upload" element={<UploadFile />} />
          <Route path="/files" element={<FileManager />}
/>        <Route
  path="/update"
  element={<UpdateTRF />}
/>
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;