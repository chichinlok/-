import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Calendar, Clock, ChevronRight, Package, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Session } from "../types";
import { AdminContext } from "../App";

const formatPreference = (pref: string) => {
  if (pref === 'Any') return '不限人數';
  if (pref === '5+') return '5 人以上';
  return `${pref} 人`;
};

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchSessions = () => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch sessions", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const isAdmin = useContext(AdminContext);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSessionToDelete(id);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    try {
      const res = await fetch(`/api/sessions/${sessionToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSessions();
      } else {
        alert("刪除失敗");
      }
    } catch (err) {
      console.error(err);
      alert("刪除失敗");
    } finally {
      setSessionToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto py-12">
        <h1 className="text-5xl font-black tracking-tight text-stone-900 sm:text-6xl mb-6 drop-shadow-[4px_4px_0_rgba(251,191,36,1)]">
          🦊約腳玩Boardgame 喇!🦊
        </h1>
        <p className="text-xl text-stone-700 font-bold bg-white inline-block px-4 py-2 border-3 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] -rotate-1">
          提議一款或多款桌遊，提供幾個日期，快速約腳拼團
        </p>
        <div className="mt-10">
          <Link
            to="/create"
            className="brutal-btn inline-flex items-center gap-2 bg-rose-400 hover:bg-rose-500 text-black px-8 py-4 text-xl"
          >
            <Calendar className="w-6 h-6" />
            發起約局
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-black text-stone-900 mb-8 inline-block border-b-4 border-sky-400">
          開放中的約局
        </h2>
        {sessions.length === 0 ? (
          <div className="brutal-card p-12 text-center bg-amber-50">
            <p className="text-stone-700 font-bold text-xl mb-4">目前沒有開放的約局。</p>
            <Link
              to="/create"
              className="brutal-btn inline-block bg-sky-400 hover:bg-sky-500 text-black px-6 py-3"
            >
              成為第一個發起約局的人吧！
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session, index) => {
              // Cycle through some fun background colors for cards
              const bgColors = ['bg-rose-50', 'bg-sky-50', 'bg-emerald-50', 'bg-amber-50', 'bg-purple-50'];
              const cardBg = bgColors[index % bgColors.length];
              
              return (
              <div
                key={session.id}
                onClick={() => navigate(`/session/${session.id}`)}
                className={`brutal-card p-6 flex flex-col h-full cursor-pointer relative ${cardBg}`}
              >
                <div className="mb-4 flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-stone-900 line-clamp-1">
                      {session.game_name}
                    </h3>
                    <p className="text-stone-700 font-bold text-sm mt-2 bg-white inline-block px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      HOST-主持：{session.host_name}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDeleteClick(e, session.id)}
                      className="p-2 text-black hover:bg-red-400 border-2 border-transparent hover:border-black rounded-xl transition-all z-10"
                      title="刪除約局"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-4 mt-auto pt-6">
                  <div className="flex items-center gap-3 text-stone-800 font-bold">
                    <div className="bg-white p-1.5 border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <Package className="w-5 h-5" />
                    </div>
                    <span>{session.game_source}</span>
                  </div>
                  <div className="flex items-center gap-3 text-stone-800 font-bold">
                    <div className="bg-white p-1.5 border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span>
                        理想人數：{formatPreference(session.player_count_preference)}
                      </span>
                      <span className={session.max_available_count! >= session.min_players ? "text-rose-600 font-black text-lg" : "text-sky-600 font-black text-lg"}>
                        {session.best_date && `${format(parseISO(session.best_date), "M月d日", { locale: zhTW })} `}
                        {session.max_available_count! >= session.max_players
                          ? "已滿團"
                          : session.max_available_count! >= session.min_players 
                          ? `已成團 (可再加 ${session.max_players - session.max_available_count!} 人)` 
                          : `欠 ${session.min_players - session.max_available_count!} 人成團`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-stone-800 font-bold">
                    <div className="bg-white p-1.5 border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] mt-1 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      {session.dates_available.slice(0, 3).map(date => (
                        <span key={date} className="bg-white px-2 py-0.5 border-2 border-black rounded-md shadow-[2px_2px_0_0_rgba(0,0,0,1)] inline-block w-fit mb-1">{format(parseISO(date), "M月d日 (EEE) HH:mm", { locale: zhTW })}</span>
                      ))}
                      {session.dates_available.length > 3 && (
                        <span className="text-stone-500">...等 {session.dates_available.length} 個時段</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center bg-black text-white py-3 rounded-xl font-black text-lg border-2 border-black shadow-[4px_4px_0_0_rgba(251,191,36,1)] group-hover:bg-rose-500 group-hover:text-black transition-colors">
                  按這裡報名!
                  <ChevronRight className="w-6 h-6 ml-1" />
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {sessionToDelete && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-[100] px-4 backdrop-blur-sm">
          <div className="brutal-card p-6 w-full max-w-sm">
            <h3 className="text-2xl font-black text-stone-900 mb-2">確定要刪除嗎？</h3>
            <p className="text-stone-700 font-bold mb-6">這個動作無法復原，所有相關的回覆也會一併刪除。</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSessionToDelete(null)} className="brutal-btn bg-stone-200 hover:bg-stone-300 text-black px-4 py-2">取消</button>
              <button onClick={confirmDelete} className="brutal-btn bg-rose-500 hover:bg-rose-600 text-white px-4 py-2">確定刪除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
