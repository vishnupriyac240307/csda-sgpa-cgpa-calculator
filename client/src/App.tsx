import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Shell } from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import DashboardPage from "./pages/DashboardPage";
import SemesterPage from "./pages/SemesterPage";
import SettingsPage from "./pages/SettingsPage";
import ResultsPage from "./pages/ResultsPage";
export default function App(){return <BrowserRouter><AuthProvider><Routes><Route path="/" element={<LandingPage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<RegisterPage/>}/><Route element={<ProtectedRoute/>}><Route element={<Shell/>}><Route path="/dashboard" element={<DashboardPage/>}/><Route path="/semester/:semester" element={<SemesterPage/>}/><Route path="/settings" element={<SettingsPage/>}/><Route path="/results" element={<ResultsPage/>}/></Route></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes></AuthProvider></BrowserRouter>;}
