import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Users,
  Calendar as CalendarIcon,
  Clock,
  Check,
  Share2,
  Copy,
  Package,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";
import { SessionWithResponses } from "../types";
import { cn } from "../lib/utils";
import { AdminContext } from "../App";

const formatPreference = (pref: string) => {
  if (pref === 'Any') return '不限人數';
  if (pref === '5+') return '5 人以上';
  return `${pref} 人`;
};

export default function SessionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionWithResponses | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAdmin = useContext(AdminContext);

  // Response form state
  const [playerName, setPlayerName] = useState("");
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = () => {
    fetch(`/api/sessions/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Session not found");
        return res.json();
      })
      .then((data) => {
        setSession(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load session details.");
        setLoading(false);
      });
  };

  const toggleDateSelection = (date: string) => {
    const newSelection = new Set(selectedDates);
    if (newSelection.has(date)) {
      newSelection.delete(date);
    } else {
      newSelection.add(date);
    }
    setSelectedDates(newSelection);
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName) {
      alert("請輸入你的名字。");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_name: playerName,
          dates_available: Array.from(selectedDates),
        }),
      });

      if (!res.ok) throw new Error("Failed to submit response");

      // Reset form and refresh data
      setPlayerName("");
      setSelectedDates(new Set());
      fetchSession();
    } catch (err) {
      console.error(err);
      alert("送出回覆失敗，請再試一次。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    let shareUrl = window.location.href;
    // If the host copies the link from their private developer preview, 
    // automatically convert it to the public shared URL so friends don't get a 403 error.
    if (shareUrl.includes('ais-dev-')) {
      shareUrl = shareUrl.replace('ais-dev-', 'ais-pre-');
    }
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        navigate('/');
      } else {
        alert("刪除失敗");
      }
    } catch (err) {
      console.error(err);
      alert("刪除失敗");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-stone-900 mb-4">哎呀！</h2>
        <p className="text-stone-600 mb-6">{error || "找不到該約局。"}</p>
        <Link to="/" className="text-emerald-600 font-medium hover:underline">
          返回首頁
        </Link>
      </div>
    );
  }

  // Calculate availability counts for each date
  const availabilityCounts = session.dates_available.reduce(
    (acc, date) => {
      acc[date] = session.responses.filter((r) =>
        r.dates_available.includes(date),
      ).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const maxAvailability = Math.max(
    ...(Object.values(availabilityCounts) as number[]),
    0,
  );
  const totalPlayers = session.responses.length + 1; // +1 for the host (assuming host is available on all proposed dates)

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Card */}
      <div className="brutal-card p-6 sm:p-8 bg-amber-50">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-black text-stone-900 mb-2 drop-shadow-[2px_2px_0_rgba(251,191,36,1)]">
              {session.game_name}
            </h1>
            <p className="text-stone-800 font-bold text-lg bg-white inline-block px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] -rotate-1">
              HOST-主持：{session.host_name}
            </p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="brutal-btn flex items-center gap-2 px-4 py-2 bg-rose-400 hover:bg-rose-500 text-black text-sm"
              >
                <Trash2 className="w-4 h-4" />
                刪除約局
              </button>
            )}
            {session.host_whatsapp && (
              <a
                href={`https://wa.me/${session.host_whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="brutal-btn flex items-center gap-2 px-4 py-2 bg-green-400 hover:bg-green-500 text-black text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                一鍵PM HOST 獲取更多資料
              </a>
            )}
            <button
              onClick={handleCopyLink}
              className="brutal-btn flex items-center gap-2 px-4 py-2 bg-sky-400 hover:bg-sky-500 text-black text-sm"
            >
              {copied ? (
                <Check className="w-5 h-5 text-black" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "已複製！" : "複製連結"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-6 border-t-4 border-black">
          <div className="flex items-center gap-2 text-stone-800 bg-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] px-3 py-1.5 rounded-lg text-sm font-bold">
            <Package className="w-4 h-4" />
            {session.game_source}
          </div>
          <div className="flex items-center gap-2 text-stone-800 bg-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] px-3 py-1.5 rounded-lg text-sm font-bold">
            <Users className="w-4 h-4" />
            理想人數：{formatPreference(session.player_count_preference)}
          </div>
          <div className="flex items-center gap-2 text-stone-800 bg-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] px-3 py-1.5 rounded-lg text-sm font-bold">
            <Clock className="w-4 h-4" />
            建立於 {format(parseISO(session.created_at), "yyyy年M月d日")}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Availability Grid */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-black text-stone-900 inline-block border-b-4 border-emerald-400">大家的時間</h2>

          <div className="brutal-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-100 border-b-4 border-black">
                    <th className="p-4 font-black text-stone-900 text-lg w-1/3 border-r-4 border-black">
                      玩家
                    </th>
                    {session.dates_available.map((date) => (
                      <th
                        key={date}
                        className="p-4 font-black text-stone-900 text-base min-w-[120px] border-r-4 border-black last:border-r-0"
                      >
                        <div className="flex flex-col">
                          <span>{format(parseISO(date), "M月d日 (EEE)", { locale: zhTW })}</span>
                          <span className="text-stone-700 font-bold">
                            {format(parseISO(date), "h:mm a")}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y-4 divide-black">
                  {/* Host Row */}
                  <tr className="hover:bg-amber-50 transition-colors">
                    <td className="p-4 font-black text-stone-900 flex items-center gap-2 border-r-4 border-black">
                      {session.host_name}{" "}
                      <span className="text-xs bg-rose-400 text-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] px-2 py-0.5 rounded-md whitespace-nowrap">
                        HOST-主持
                      </span>
                      {session.host_whatsapp && (
                        <a
                          href={`https://wa.me/${session.host_whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 bg-green-400 text-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] px-2 py-0.5 rounded-md hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all ml-1 text-xs font-black whitespace-nowrap"
                          title="WhatsApp Host"
                        >
                          <MessageCircle className="w-3 h-3" />
                          一鍵 PM
                        </a>
                      )}
                    </td>
                    {session.dates_available.map((date) => (
                      <td key={date} className="p-4 text-center border-r-4 border-black last:border-r-0">
                        <div className="inline-flex justify-center items-center w-10 h-10 rounded-xl bg-emerald-400 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-black">
                          <Check className="w-6 h-6 stroke-[3]" />
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Responses Rows */}
                  {session.responses.map((response, responseIndex) => (
                    <tr
                      key={response.id}
                      className="hover:bg-sky-50 transition-colors"
                    >
                      <td className="p-4 text-stone-800 font-bold border-r-4 border-black">
                        {response.player_name}
                      </td>
                      {session.dates_available.map((date) => {
                        const isAvailable = response.dates_available.includes(date);
                        let peopleBefore = 1; // Host
                        for (let i = 0; i < responseIndex; i++) {
                          if (session.responses[i].dates_available.includes(date)) {
                            peopleBefore++;
                          }
                        }
                        const isWaiting = isAvailable && peopleBefore >= session.max_players;

                        return (
                        <td key={date} className="p-4 text-center border-r-4 border-black last:border-r-0">
                          {isAvailable ? (
                            <div className={cn(
                              "inline-flex justify-center items-center w-10 h-10 rounded-xl border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-black relative",
                              isWaiting ? "bg-amber-300" : "bg-emerald-400"
                            )}>
                              <Check className="w-6 h-6 stroke-[3]" />
                              {isWaiting && (
                                <span className="absolute -bottom-2 -right-2 bg-white text-[10px] font-black px-1 border-2 border-black rounded shadow-[1px_1px_0_0_rgba(0,0,0,1)] whitespace-nowrap">
                                  Waiting list
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex justify-center items-center w-10 h-10 rounded-xl bg-stone-200 border-2 border-stone-400 text-stone-500">
                              -
                            </div>
                          )}
                        </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-sky-100 border-t-4 border-black">
                  <tr>
                    <td className="p-4 font-black text-stone-900 border-r-4 border-black">
                      已報名人數
                    </td>
                    {session.dates_available.map((date) => {
                      // +1 for host
                      const count = availabilityCounts[date] + 1;
                      const isBest = count >= session.min_players && count <= session.max_players;
                      const isOver = count > session.max_players;

                      return (
                        <td key={date} className="p-4 text-center border-r-4 border-black last:border-r-0">
                          <div
                            className={cn(
                              "inline-flex font-black text-2xl",
                              isBest ? "text-rose-600" : isOver ? "text-amber-600" : "text-stone-900",
                            )}
                          >
                            {count} 人
                          </div>
                          <div className={cn(
                            "text-sm mt-1 font-bold",
                            count >= session.min_players ? "text-rose-600" : "text-stone-600"
                          )}>
                            {count >= session.max_players
                              ? "已滿團"
                              : count >= session.min_players 
                              ? `已成團 (可再加 ${session.max_players - count} 人)` 
                              : `欠 ${session.min_players - count} 人成團`}
                          </div>
                          {isOver && (
                            <div className="text-xs font-black mt-1 bg-amber-300 text-black inline-block px-2 py-0.5 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                              {count - session.max_players} 人 Waiting
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Add Response Form */}
        <div className="md:col-span-1">
          <div className="brutal-card p-6 sticky top-24 bg-purple-50">
            <h3 className="text-2xl font-black text-stone-900 mb-6 drop-shadow-[2px_2px_0_rgba(251,191,36,1)]">
              報名表
            </h3>

            <form onSubmit={handleSubmitResponse} className="space-y-6">
              <div>
                <label
                  htmlFor="playerName"
                  className="block text-base font-bold text-stone-900 mb-2"
                >
                  你的名字
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="brutal-input w-full px-4 py-3 text-base"
                  placeholder="例如：小華"
                  required
                />
              </div>

              <div>
                <label className="block text-base font-bold text-stone-900 mb-3">
                  選擇你可以參加的日期
                </label>
                <div className="space-y-3">
                  {session.dates_available.map((date) => {
                    const isFull = availabilityCounts[date] + 1 >= session.max_players;
                    return (
                    <label
                      key={date}
                      className={cn(
                        "flex items-center p-3 border-3 rounded-xl cursor-pointer transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)]",
                        selectedDates.has(date)
                          ? "border-black bg-emerald-300 -translate-y-0.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                          : "border-black bg-white hover:bg-stone-50 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedDates.has(date)}
                        onChange={() => toggleDateSelection(date)}
                      />
                      <div
                        className={cn(
                          "w-6 h-6 rounded-md border-2 flex items-center justify-center mr-4 transition-colors",
                          selectedDates.has(date)
                            ? "bg-black border-black"
                            : "border-black bg-white",
                        )}
                      >
                        {selectedDates.has(date) && (
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={cn(
                            "text-base font-black",
                            selectedDates.has(date)
                              ? "text-black"
                              : "text-stone-800",
                          )}
                        >
                          {format(parseISO(date), "M月d日 (EEE)", { locale: zhTW })}
                          {isFull && (
                            <span className="ml-2 text-xs bg-amber-300 text-black px-2 py-0.5 rounded-md border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] align-middle">
                              Waiting list only
                            </span>
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-bold",
                            selectedDates.has(date)
                              ? "text-black/80"
                              : "text-stone-500",
                          )}
                        >
                          {format(parseISO(date), "h:mm a")}
                        </span>
                      </div>
                    </label>
                  )})}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !playerName}
                className="brutal-btn w-full bg-black text-white px-4 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4 hover:bg-rose-500 hover:text-black"
              >
                {isSubmitting ? "送出中..." : "送出時間"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-[100] px-4 backdrop-blur-sm">
          <div className="brutal-card p-6 w-full max-w-sm">
            <h3 className="text-2xl font-black text-stone-900 mb-2">確定要刪除嗎？</h3>
            <p className="text-stone-700 font-bold mb-6">這個動作無法復原，所有相關的回覆也會一併刪除。</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="brutal-btn bg-stone-200 hover:bg-stone-300 text-black px-4 py-2">取消</button>
              <button onClick={handleDelete} className="brutal-btn bg-rose-500 hover:bg-rose-600 text-white px-4 py-2">確定刪除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
