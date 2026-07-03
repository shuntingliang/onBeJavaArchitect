import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DevicePage from "@/pages/DevicePage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DevicePage />} />
        <Route path="/devices" element={<DevicePage />} />
      </Routes>
    </Router>
  );
}
