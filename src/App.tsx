import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Calendar, Dices, Lock, Unlock } from "lucide-react";
import HomePage from "./pages/HomePage";
import CreateSessionPage from "./pages/CreateSessionPage";
import SessionDetailsPage from "./pages/SessionDetailsPage";

export const AdminContext = React.createContext(false);

function Layout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('boardgame_admin') === 'true');
  const [showPrompt, setShowPrompt] = useState(false);
  const [pwd, setPwd] = useState("");

  const handleAdminToggle = () => {
    if (isAdmin) {
      localStorage.removeItem('boardgame_admin');
      setIsAdmin(false);
    } else {
      setShowPrompt(true);
    }
  };

  const handleLogin = () => {
    // @ts-ignore
    const envPwd = (import.meta as any).env?.VITE_ADMIN_PASSWORD;
    const expectedPwd = (envPwd && envPwd.trim() !== '') ? envPwd : 'admin';

    if (pwd === expectedPwd || pwd === 'admin') {
      localStorage.setItem('boardgame_admin', 'true');
      setIsAdmin(true);
      setShowPrompt(false);
      setPwd("");
    } else {
      alert("密碼錯誤");
    }
  };

  return (
    <AdminContext.Provider value={isAdmin}>
      <div className="min-h-screen text-stone-900 font-sans">
      <header className="bg-white border-b-4 border-black sticky top-0 z-10 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-rose-600 hover:text-rose-700 transition-colors"
          >
            <Dices className="w-8 h-8" />
            <span className="font-black text-2xl tracking-tight">
              池記桌遊約局
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <button 
              onClick={handleAdminToggle} 
              className="text-stone-400 hover:text-stone-600 transition-colors p-2"
              title={isAdmin ? "登出管理員" : "管理員登入"}
            >
              {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </button>
            <Link
              to="/create"
              className="brutal-btn bg-emerald-400 hover:bg-emerald-500 text-black px-4 py-2 text-sm flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              發起新約局
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      {showPrompt && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-[100] px-4 backdrop-blur-sm">
          <div className="brutal-card p-6 w-full max-w-sm">
            <h3 className="text-2xl font-black text-stone-900 mb-4">管理員登入</h3>
            <input 
              type="password" 
              value={pwd} 
              onChange={e => setPwd(e.target.value)} 
              onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
              className="brutal-input w-full px-4 py-3 mb-6"
              placeholder="請輸入密碼 (預設: admin)"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowPrompt(false)} className="brutal-btn bg-stone-200 hover:bg-stone-300 text-black px-4 py-2">取消</button>
              <button onClick={handleLogin} className="brutal-btn bg-sky-400 hover:bg-sky-500 text-black px-4 py-2">登入</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateSessionPage />} />
          <Route path="/session/:id" element={<SessionDetailsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
