import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { GraduationCap, LayoutDashboard, Settings, FileText, LogOut, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { useState } from "react";
export function Shell() {
  const { user, setUser } = useAuth(); const nav = useNavigate(); const [open, setOpen] = useState(false);
  const logout = async () => { await api.post("/api/auth/logout"); setUser(null); nav("/login"); };
  const links = [{to:"/dashboard",label:"Dashboard",icon:LayoutDashboard},{to:"/results",label:"Results",icon:FileText},{to:"/settings",label:"Settings",icon:Settings}];
  return <div className="app-shell"><aside className={`sidebar ${open?"sidebar-open":""}`}><Link className="brand" to="/dashboard"><span className="brand-icon"><GraduationCap/></span><span>CSDA<span className="brand-sub">ACADEMIC CALCULATOR</span></span></Link><nav>{links.map(x=><NavLink onClick={()=>setOpen(false)} key={x.to} to={x.to} className={({isActive})=>isActive?"nav-link active":"nav-link"}><x.icon size={18}/>{x.label}</NavLink>)}</nav><button className="nav-link logout" onClick={logout}><LogOut size={18}/>Log out</button></aside><main className="main-area"><header className="topbar"><button className="menu-btn" onClick={()=>setOpen(!open)}><Menu/></button><div className="topbar-right"><span>{user?.fullName}</span><span className="avatar">{user?.fullName?.charAt(0).toUpperCase()}</span></div></header><div className="page-wrap"><Outlet/></div></main></div>;
}
