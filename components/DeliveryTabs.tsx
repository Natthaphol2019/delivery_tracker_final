import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  CheckCircle2,
  Trash2,
  Delete,
  Plus,
  ArrowLeft,
  ClipboardEdit,
  PieChart,
  Package,
  Coins,
  History,
  Search,
  Clock,
  CalendarDays,
  Filter,
  Sparkles,
} from "lucide-react";

export function TrackerTab({ delivery }: { delivery: any }) {
  const {
    currentDate,
    todayTotal,
    isSettingUp,
    totalItemsCount,
    setTotalItemsCount,
    startTracking,
    filledCount,
    currentTotalAmount,
    itemRates,
    activeIndex,
    setActiveIndex,
    activeItemRef,
    handleUndo,
    handleCancelEntry,
    isCustomMode,
    presetRates,
    handleRateSelect,
    setIsCustomMode,
    customRate,
    setCustomRate,
    confirmSubmit,
    progressPercent,
    isLoading,
  } = delivery;

  return (
    <div className="flex-1 flex flex-col relative z-10">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/70 shrink-0">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {!isSettingUp && (
                <button
                  onClick={() => window.history.back()}
                  className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 active:scale-90 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-300/50">
                  <CalendarDays className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-sm tracking-widest uppercase bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  ลงยอดวันนี้
                </span>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-sm font-black text-slate-800">
                {format(currentDate, "d MMMM yyyy", { locale: th })}
              </h2>
              <p className="text-xs text-emerald-600 font-bold mt-0.5">
                ยอดบิลวันนี้: ฿{todayTotal.toLocaleString()}
              </p>
            </div>
          </div>
          {!isSettingUp && (
            <div className="bg-slate-100 h-1.5 w-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 h-1.5 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md w-full mx-auto flex-1 flex flex-col relative pb-24">
        {isSettingUp ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative bg-white p-8 rounded-3xl shadow-2xl shadow-indigo-200/60 border border-slate-100 w-full text-center overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full blur-2xl" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-300/60 rotate-3">
                <ClipboardEdit className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-slate-800 mb-2">
                เริ่มรอบบิลใหม่
              </h1>
              <p className="text-slate-500 text-sm mb-8">
                ใส่จำนวนชิ้นพัสดุทั้งหมดของวันนี้
              </p>
              <input
                type="number"
                inputMode="numeric"
                autoFocus
                value={totalItemsCount}
                onChange={(e) => setTotalItemsCount(e.target.value)}
                placeholder="0"
                className="relative w-full text-center text-6xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent outline-none border-b-2 border-slate-200 pb-4 mb-8 focus:border-indigo-500 placeholder:text-slate-200 transition-colors"
              />
              <button
                onClick={startTracking}
                disabled={!totalItemsCount || Number(totalItemsCount) <= 0}
                className="relative w-full bg-gradient-to-r from-slate-900 to-slate-700 disabled:from-slate-200 disabled:to-slate-200 text-white py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-lg shadow-slate-300/50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" /> เริ่มคีย์ราคา
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col pb-[280px] animate-in fade-in duration-300">
            <div className="bg-white/70 backdrop-blur-md p-4 sticky top-0 z-20 border-b border-slate-200 flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  ทำรายการ
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-slate-800">
                    {filledCount}
                  </span>
                  <span className="text-slate-500 font-medium">
                    / {totalItemsCount}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  ยอดรวมบิลนี้
                </p>
                <p className="text-2xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent mt-1">
                  ฿
                  {currentTotalAmount.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {itemRates.map((rate: string, index: number) => {
                  const isActive = activeIndex === index;
                  const hasValue = rate !== "";
                  return (
                    <div
                      key={index}
                      ref={isActive ? activeItemRef : null}
                      onClick={() => setActiveIndex(index)}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-200 border-b-2 ${isActive ? "bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-500 shadow-md shadow-indigo-100 scale-[1.03]" : hasValue ? "bg-white border-transparent text-slate-700 shadow-sm" : "bg-transparent border-slate-200/50 text-slate-300"}`}
                    >
                      <span
                        className={`font-mono text-sm ${isActive ? "text-indigo-500 font-bold" : "text-slate-400"}`}
                      >
                        {String(index + 1).padStart(2, "0")}.
                      </span>
                      <span
                        className={`font-bold text-lg ${isActive && !hasValue ? "animate-pulse text-indigo-300" : ""} ${hasValue && !isActive ? "text-emerald-600" : ""}`}
                      >
                        {hasValue ? rate : isActive ? "_" : "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {!isSettingUp && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 pb-safe shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.15)] z-40">
          <div className="max-w-md mx-auto">
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleUndo}
                className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 shadow-sm hover:border-indigo-200 transition-all"
              >
                <Delete className="w-5 h-5" />{" "}
                <span className="text-sm">ลบถอยหลัง</span>
              </button>
              <button
                onClick={handleCancelEntry}
                className="px-4 bg-gradient-to-br from-red-50 to-rose-50 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center active:scale-95 border border-red-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            {!isCustomMode ? (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {presetRates.slice(0, 7).map((rate: number) => (
                  <button
                    key={rate}
                    onClick={() => handleRateSelect(rate)}
                    className="bg-white border border-slate-200 hover:border-indigo-300 text-slate-800 py-4 rounded-xl font-black text-xl shadow-sm active:bg-gradient-to-br active:from-indigo-50 active:to-violet-50 active:text-indigo-600 active:scale-95 transition-all"
                  >
                    {rate}
                  </button>
                ))}
                <button
                  onClick={() => setIsCustomMode(true)}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-4 rounded-xl font-bold shadow-md active:scale-95 flex items-center justify-center transition-all"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setIsCustomMode(false)}
                  className="px-4 bg-slate-300 text-slate-700 font-bold rounded-xl active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  placeholder="ราคา..."
                  className="flex-1 bg-white px-4 py-4 rounded-xl font-black text-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-center"
                />
                <button
                  onClick={() => handleRateSelect(customRate)}
                  className="px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg rounded-xl active:scale-95 shadow-md shadow-indigo-200"
                >
                  ตกลง
                </button>
              </div>
            )}
            <button
              onClick={confirmSubmit}
              disabled={filledCount < Number(totalItemsCount) || isLoading}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${filledCount === Number(totalItemsCount) ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-200 hover:from-emerald-600 hover:to-teal-600" : "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"}`}
            >
              {isLoading ? (
                "กำลังบันทึก..."
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />{" "}
                  {filledCount === Number(totalItemsCount)
                    ? "บันทึกบิลนี้เลย!"
                    : `ยังกรอกไม่ครบ (${filledCount}/${totalItemsCount})`}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SummaryTab({ delivery }: { delivery: any }) {
  const {
    selectedDateDetail,
    selectedCycle,
    setSelectedCycle,
    availableCycles,
    filteredSummary,
    openDayDetail,
    goTo,
    dayDetailItems,
    handleEditItem,
    isLoading,
  } = delivery;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-24 relative z-10">
      {!selectedDateDetail ? (
        <>
          <header className="bg-white px-5 py-6 shadow-sm border-b border-slate-200 sticky top-0 z-20">
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    สรุปยอดจัดส่ง
                  </h1>
                  <p className="text-slate-500 text-sm mt-0.5">
                    กดที่การ์ดเพื่อดูและแก้ไขรายชิ้น
                  </p>
                </div>
              </div>

              {/* Filter */}
              <div className="mt-5 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg shadow-sm">
                <Filter className="w-4 h-4 text-blue-600 shrink-0" />
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="w-full bg-transparent outline-none font-semibold text-slate-700 text-sm cursor-pointer"
                >
                  <option value="ALL">ดูทุกรอบบิล (ทั้งหมด)</option>
                  {availableCycles.map((cycle: string) => (
                    <option key={cycle} value={cycle}>
                      {cycle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Card (Corporate Style) */}
              <div className="mt-5 bg-slate-900 rounded-xl p-6 text-white shadow-md border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                <div className="relative flex items-center gap-2 text-slate-400 mb-2 text-sm font-medium">
                  <Coins className="w-4 h-4 text-blue-400" /> ยอดรวมรอบที่เลือก
                </div>
                <h2 className="relative text-3xl font-bold mb-5 text-white">
                  ฿
                  {filteredSummary
                    .reduce((sum: number, day: any) => sum + day.totalAmount, 0)
                    .toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </h2>
                <div className="relative flex items-center gap-2 bg-slate-800 w-max px-3 py-1.5 rounded-md text-sm font-medium border border-slate-700 text-blue-300">
                  <Package className="w-4 h-4" /> รวม{" "}
                  {filteredSummary
                    .reduce((sum: number, day: any) => sum + day.totalItems, 0)
                    .toLocaleString()}{" "}
                  ชิ้น
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-md w-full mx-auto flex-1 p-4">
            {isLoading ? (
              <div className="text-center text-slate-400 mt-10 font-medium">
                กำลังโหลดข้อมูล...
              </div>
            ) : filteredSummary.length === 0 ? (
              <div className="text-center bg-white border border-slate-200 rounded-xl p-8 mt-4 shadow-sm">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">
                  ไม่พบข้อมูลในรอบบิลนี้
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ลองเปลี่ยนตัวกรองรอบบิลด้านบนดูอีกครั้ง
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSummary.map((day: any) => {
                  const d = new Date(day.date);
                  return (
                    <div
                      key={day.date}
                      onClick={() => openDayDetail(day.date)}
                      className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all active:bg-slate-50"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-200">
                          {day.cycle}
                        </div>
                      </div>
                      <div className="flex justify-between items-end mb-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-slate-800">
                            {format(d, "dd")}
                          </span>
                          <div className="flex flex-col leading-none">
                            <span className="text-sm font-bold text-slate-500">
                              {format(d, "MMM", { locale: th })}
                            </span>
                            <span className="text-xs text-slate-400">
                              {format(d, "yyyy")}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600">
                            ฿{day.totalAmount.toLocaleString("th-TH")}
                          </p>
                          <p className="text-sm font-semibold text-slate-500 mt-0.5">
                            {day.totalItems} ชิ้น
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-slate-400 text-xs font-medium mt-4 border-t border-slate-100 pt-3 justify-center gap-1.5">
                        <Search className="w-3.5 h-3.5" />{" "}
                        แตะเพื่อตรวจสอบรายชิ้น
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </>
      ) : (
        /* หน้าต่างดูรายละเอียดรายวัน (Detail View) */
        <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
          <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-200 shrink-0 p-4">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <button
                onClick={() => window.history.back()}
                className="p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-600 active:bg-slate-100 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  {format(new Date(selectedDateDetail), "dd MMM yyyy", {
                    locale: th,
                  })}
                </h2>
                <p className="text-xs text-blue-600 font-semibold mt-0.5">
                  รวม {dayDetailItems.length} ชิ้น
                </p>
              </div>
              <div className="w-9"></div>
            </div>
          </header>
          <main className="max-w-md w-full mx-auto flex-1 p-4 bg-slate-50">
            <div className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium mb-4 flex items-center gap-2">
              <ClipboardEdit className="w-4 h-4 shrink-0" />{" "}
              แตะที่แถวเพื่อแก้ไขราคา
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {dayDetailItems.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => handleEditItem(item)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all active:bg-slate-50"
                >
                  <span className="font-mono text-sm font-semibold text-slate-500">
                    {String(item.item_index).padStart(2, "0")}.
                  </span>
                  <span className="font-bold text-base text-slate-800">
                    {item.rate_per_piece}
                  </span>
                </div>
              ))}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

export function HistoryTab({ delivery }: { delivery: any }) {
  const { editLogs, isLoading } = delivery;
  return (
    <div className="flex-1 flex flex-col bg-transparent pb-24 relative z-10">
      <header className="bg-white/80 backdrop-blur-xl px-4 py-6 shadow-sm border-b border-slate-200/70">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-300/50">
              <History className="w-5 h-5 text-white" />
            </div>
            ประวัติการแก้ไข
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            ตรวจสอบความเคลื่อนไหว (Audit Log)
          </p>
        </div>
      </header>
      <main className="max-w-md w-full mx-auto flex-1 p-4">
        {isLoading ? (
          <p className="text-center text-slate-400 mt-10">กำลังโหลด...</p>
        ) : editLogs.length === 0 ? (
          <div className="text-center text-slate-400 mt-10">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>ยังไม่มีประวัติการแก้ไขข้อมูล</p>
          </div>
        ) : (
          <div className="space-y-3">
            {editLogs.map((log: any) => (
              <div
                key={log.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50 hover:shadow-md hover:border-indigo-100 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(log.edited_at), "dd MMM yy, HH:mm", {
                      locale: th,
                    })}
                  </div>
                  <div className="text-[10px] font-bold px-2 py-1 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 rounded-md border border-indigo-100">
                    บิล{" "}
                    {format(new Date(log.delivery_date), "dd/MM", {
                      locale: th,
                    })}
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  แก้ชิ้นที่:{" "}
                  <span className="text-lg font-black text-indigo-600">
                    #{log.item_index}
                  </span>
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="line-through text-slate-400">
                    {log.old_rate} บ.
                  </span>
                  <ArrowLeft className="w-4 h-4 text-slate-300 rotate-180" />
                  <span className="font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                    {log.new_rate} บ.
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export function BottomNav({ delivery }: { delivery: any }) {
  const { hideBottomNav, goTo, activeTab } = delivery;
  if (hideBottomNav) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 pb-safe z-50 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
      <div className="max-w-md mx-auto flex">
        <button
          onClick={() => goTo({ tab: "tracker", selectedDateDetail: null })}
          className={`flex-1 flex flex-col items-center justify-center py-4 gap-1 transition-colors relative ${activeTab === "tracker" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          {activeTab === "tracker" && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-b-full shadow-[0_2px_8px_rgba(99,102,241,0.5)]" />
          )}
          <ClipboardEdit className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            บันทึกยอด
          </span>
        </button>
        <button
          onClick={() => goTo({ tab: "summary" })}
          className={`flex-1 flex flex-col items-center justify-center py-4 gap-1 transition-colors relative ${activeTab === "summary" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          {activeTab === "summary" && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-b-full shadow-[0_2px_8px_rgba(99,102,241,0.5)]" />
          )}
          <PieChart className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            สรุปยอด
          </span>
        </button>
        <button
          onClick={() => goTo({ tab: "history", selectedDateDetail: null })}
          className={`flex-1 flex flex-col items-center justify-center py-4 gap-1 transition-colors relative ${activeTab === "history" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          {activeTab === "history" && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-b-full shadow-[0_2px_8px_rgba(99,102,241,0.5)]" />
          )}
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            ประวัติ
          </span>
        </button>
      </div>
    </nav>
  );
}
