import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export default function CreateSessionPage() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("");
  const [hostWhatsapp, setHostWhatsapp] = useState("");
  const [gameName, setGameName] = useState("");
  const [gameSource, setGameSource] = useState("自己帶game");
  const [playerCount, setPlayerCount] = useState("3-4");
  const [minPlayers, setMinPlayers] = useState("3");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [dateOptions, setDateOptions] = useState<{date: string, time: string}[]>([{ date: "", time: "19:00" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDate = () => {
    setDateOptions([...dateOptions, { date: "", time: "19:00" }]);
  };

  const handleRemoveDate = (index: number) => {
    const newOptions = [...dateOptions];
    newOptions.splice(index, 1);
    setDateOptions(newOptions);
  };

  const handleDateChange = (index: number, field: 'date' | 'time', value: string) => {
    const newOptions = [...dateOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setDateOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty dates
    const validDates = dateOptions
      .filter((d) => d.date.trim() !== "")
      .map((d) => `${d.date}T${d.time}`);

    if (!hostName || !gameName || !playerCount || validDates.length === 0) {
      alert("請填寫所有欄位並提供至少一個日期。");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host_name: hostName,
          host_whatsapp: hostWhatsapp,
          game_name: gameName,
          player_count_preference: playerCount,
          dates_available: validDates,
          game_source: gameSource,
          min_players: parseInt(minPlayers, 10),
          max_players: parseInt(maxPlayers, 10),
        }),
      });

      if (!res.ok) throw new Error("Failed to create session");

      const data = await res.json();
      navigate(`/session/${data.id}`);
    } catch (err) {
      console.error(err);
      alert("建立約局失敗，請再試一次。");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-stone-900 drop-shadow-[2px_2px_0_rgba(251,191,36,1)]">
          發起桌遊約局
        </h1>
        <p className="text-stone-800 font-bold mt-4 bg-white inline-block px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] -rotate-1">
          填寫以下詳細資訊來開始組織你的下一場桌遊之夜。
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="brutal-card p-6 sm:p-8 bg-sky-50"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="hostName"
                className="block text-base font-bold text-stone-900 mb-2"
              >
                你的名字
              </label>
              <input
                type="text"
                id="hostName"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="brutal-input w-full px-4 py-3 text-base"
                placeholder="例如：小明"
                required
              />
            </div>

            <div>
              <label
                htmlFor="hostWhatsapp"
                className="block text-base font-bold text-stone-900 mb-2"
              >
                WhatsApp 號碼 (選填)
              </label>
              <input
                type="tel"
                id="hostWhatsapp"
                value={hostWhatsapp}
                onChange={(e) => setHostWhatsapp(e.target.value)}
                className="brutal-input w-full px-4 py-3 text-base"
                placeholder="例如：91234567"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="gameName"
              className="block text-base font-bold text-stone-900 mb-2"
            >
              想玩的遊戲
            </label>
            <input
              type="text"
              id="gameName"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="brutal-input w-full px-4 py-3 text-base"
              placeholder="例如：卡坦島、殖民火星"
              required
            />
          </div>

          <div>
            <label
              htmlFor="gameSource"
              className="block text-base font-bold text-stone-900 mb-2"
            >
              遊戲來源
            </label>
            <select
              id="gameSource"
              value={gameSource}
              onChange={(e) => setGameSource(e.target.value)}
              className="brutal-input w-full px-4 py-3 text-base bg-white"
            >
              <option value="自己帶game">自己帶game</option>
              <option value="場地有game">場地有game</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="playerCount"
              className="block text-base font-bold text-stone-900 mb-2"
            >
              理想遊玩人數
            </label>
            <select
              id="playerCount"
              value={playerCount}
              onChange={(e) => setPlayerCount(e.target.value)}
              className="brutal-input w-full px-4 py-3 text-base bg-white"
            >
              <option value="2">2 人</option>
              <option value="3">3 人</option>
              <option value="4">4 人</option>
              <option value="3-4">3-4 人</option>
              <option value="5">5 人</option>
              <option value="5+">5 人以上</option>
              <option value="Any">不限</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="minPlayers"
                className="block text-base font-bold text-stone-900 mb-2"
              >
                最少幾人成團
              </label>
              <input
                type="number"
                id="minPlayers"
                min="2"
                max="20"
                value={minPlayers}
                onChange={(e) => setMinPlayers(e.target.value)}
                className="brutal-input w-full px-4 py-3 text-base"
                required
              />
            </div>
            <div>
              <label
                htmlFor="maxPlayers"
                className="block text-base font-bold text-stone-900 mb-2"
              >
                最多幾人
              </label>
              <input
                type="number"
                id="maxPlayers"
                min="2"
                max="20"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                className="brutal-input w-full px-4 py-3 text-base"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-base font-bold text-stone-900">
                提議的日期與時間
              </label>
            </div>
            <div className="space-y-4">
              {dateOptions.map((opt, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="relative flex-1 flex gap-3">
                    <input
                      type="date"
                      value={opt.date}
                      onChange={(e) => handleDateChange(index, 'date', e.target.value)}
                      className="brutal-input w-3/5 px-4 py-3 text-base"
                      required
                    />
                    <select
                      value={opt.time}
                      onChange={(e) => handleDateChange(index, 'time', e.target.value)}
                      className="brutal-input w-2/5 px-4 py-3 text-base bg-white"
                    >
                      {Array.from({ length: 24 }).flatMap((_, h) => 
                        ['00', '15', '30', '45'].map(m => {
                          const hour = h.toString().padStart(2, '0');
                          return <option key={`${hour}:${m}`} value={`${hour}:${m}`}>{`${hour}:${m}`}</option>;
                        })
                      )}
                    </select>
                  </div>
                  {dateOptions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDate(index)}
                      className="p-2 text-black hover:bg-rose-400 border-2 border-transparent hover:border-black rounded-xl transition-all"
                      aria-label="移除日期"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddDate}
              className="mt-4 flex items-center gap-2 text-base font-black text-emerald-600 hover:text-emerald-700 transition-colors bg-white px-3 py-1.5 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-lg"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              新增其他時間選項
            </button>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t-4 border-black flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="brutal-btn bg-rose-400 hover:bg-rose-500 text-black px-8 py-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "建立中..." : "建立約局"}
          </button>
        </div>
      </form>
    </div>
  );
}
