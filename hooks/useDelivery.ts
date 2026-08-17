import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Swal from "sweetalert2";

type NavState = {
  __app: true;
  tab: "tracker" | "summary" | "history";
  isSettingUp: boolean;
  selectedDateDetail: string | null;
};

export function useDelivery(activeProfile: any) {
  const supabase = createClient();

  // ================= STATE =================
  const [activeTab, setActiveTab] = useState<"tracker" | "summary" | "history">(
    "tracker",
  );
  const [currentDate] = useState(new Date());
  const [isSettingUp, setIsSettingUp] = useState(true);
  const [totalItemsCount, setTotalItemsCount] = useState<string>("");
  const [itemRates, setItemRates] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customRate, setCustomRate] = useState<string>("");
  // หาบรรทัดนี้แล้วแก้เป็น
  const [presetRates, setPresetRates] = useState<number[]>([]);
  const [todayTotal, setTodayTotal] = useState<number>(0);

  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [availableCycles, setAvailableCycles] = useState<string[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("ALL");
  const [selectedDateDetail, setSelectedDateDetail] = useState<string | null>(
    null,
  );
  const [dayDetailItems, setDayDetailItems] = useState<any[]>([]);

  const [editLogs, setEditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const activeItemRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef(activeTab);
  const isSettingUpRef = useRef(isSettingUp);
  const selectedDateDetailRef = useRef(selectedDateDetail);
  const itemRatesRef = useRef(itemRates);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  useEffect(() => {
    isSettingUpRef.current = isSettingUp;
  }, [isSettingUp]);
  useEffect(() => {
    selectedDateDetailRef.current = selectedDateDetail;
  }, [selectedDateDetail]);
  useEffect(() => {
    itemRatesRef.current = itemRates;
  }, [itemRates]);

  // ================= BROWSER HISTORY LOGIC =================
  const buildState = (
    overrides: Partial<Omit<NavState, "__app">> = {},
  ): NavState => ({
    __app: true,
    tab: activeTabRef.current,
    isSettingUp: isSettingUpRef.current,
    selectedDateDetail: selectedDateDetailRef.current,
    ...overrides,
  });

  const goTo = (overrides: Partial<Omit<NavState, "__app">>) => {
    if (overrides.tab !== undefined) setActiveTab(overrides.tab);
    if (overrides.isSettingUp !== undefined)
      setIsSettingUp(overrides.isSettingUp);
    if ("selectedDateDetail" in overrides)
      setSelectedDateDetail(overrides.selectedDateDetail ?? null);
    window.history.pushState(buildState(overrides), "");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.history.state || !(window.history.state as any).__app) {
      window.history.replaceState(buildState(), "");
    }

    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as NavState | null;
      if (!state || !state.__app) return;

      const leavingEntryWithProgress =
        activeTabRef.current === "tracker" &&
        !isSettingUpRef.current &&
        state.isSettingUp === true &&
        itemRatesRef.current.some((r) => r !== "");

      if (leavingEntryWithProgress) {
        Swal.fire({
          title: "ยกเลิกการกรอกยอด?",
          text: "ข้อมูลที่กรอกไว้จะหายไปทั้งหมด",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#ef4444",
          cancelButtonColor: "#64748b",
          confirmButtonText: "ใช่ ยกเลิกเลย",
          cancelButtonText: "กรอกต่อ",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            setItemRates([]);
            setTotalItemsCount("");
            setIsSettingUp(true);
          } else {
            window.history.pushState(buildState({ isSettingUp: false }), "");
          }
        });
        return;
      }

      setActiveTab(state.tab);
      setIsSettingUp(state.isSettingUp);
      setSelectedDateDetail(state.selectedDateDetail);
      if (state.selectedDateDetail) fetchDayDetail(state.selectedDateDetail);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const getBillingCycle = (dateString: string) => {
    const d = new Date(dateString);
    const year = d.getFullYear() + 543;
    const month = format(d, "MMM", { locale: th });
    const day = d.getDate();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    if (day <= 15) return `รอบ 1-15 ${month} ${year}`;
    else return `รอบ 16-${lastDay} ${month} ${year}`;
  };

  // ================= API FETCHERS =================
  const fetchRates = async () => {
    if (!activeProfile?.id) return;

    // ดึงข้อมูลและเรียงเรทจากน้อยไปมาก (ascending: true)
    const { data } = await supabase
      .from("custom_rates")
      .select("rate")
      .eq("user_id", activeProfile.id)
      .order("rate", { ascending: true });

    if (data && data.length > 0) {
      setPresetRates(data.map((d) => Number(d.rate)));
    } else {
      // ถ้าพนักงานคนนี้ยังไม่เคยบันทึกเรทเลย ให้โชว์ค่า Default เริ่มต้นไปก่อน
      setPresetRates([6.5, 6.75, 7]);
    }
  };

  const fetchDeliveriesForDate = async (date: Date) => {
    if (!activeProfile?.id) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const { data } = await supabase
      .from("deliveries")
      .select("total_amount")
      .eq("delivery_date", dateStr)
      .eq("user_id", activeProfile.id);
    if (data)
      setTodayTotal(
        data.reduce((sum, item) => sum + Number(item.total_amount), 0),
      );
  };

  const loadSummaryData = async () => {
    if (!activeProfile?.id) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("deliveries")
      .select("*")
      .eq("user_id", activeProfile.id)
      .order("delivery_date", { ascending: false });
    if (data) {
      const grouped = data.reduce((acc, curr) => {
        const date = curr.delivery_date;
        const cycle = getBillingCycle(date);
        if (!acc[date])
          acc[date] = { date, totalItems: 0, totalAmount: 0, cycle };
        acc[date].totalItems += curr.quantity;
        acc[date].totalAmount += Number(curr.total_amount);
        return acc;
      }, {} as any);
      const summaryArray = Object.values(grouped) as any[];
      setSummaryData(summaryArray);
      setAvailableCycles(
        Array.from(new Set(summaryArray.map((item) => item.cycle))),
      );
    }
    setIsLoading(false);
  };

  const fetchDayDetail = async (dateStr: string) => {
    if (!activeProfile?.id) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("deliveries")
      .select("*")
      .eq("delivery_date", dateStr)
      .eq("user_id", activeProfile.id)
      .order("item_index", { ascending: true });
    if (data) setDayDetailItems(data);
    setIsLoading(false);
  };

  const loadEditLogs = async () => {
    if (!activeProfile?.id) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("delivery_edit_logs")
      .select("*")
      .eq("user_id", activeProfile.id)
      .order("edited_at", { ascending: false })
      .limit(50);
    if (data) setEditLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeProfile?.id) fetchRates();
  }, [activeProfile?.id]);
  useEffect(() => {
    if (!activeProfile?.id) return;
    if (activeTab === "tracker") fetchDeliveriesForDate(currentDate);
    else if (activeTab === "summary") loadSummaryData();
    else if (activeTab === "history") loadEditLogs();
  }, [currentDate, activeTab, activeProfile?.id]);

  // ================= ACTION HANDLERS =================
  const startTracking = async () => {
    const count = Number(totalItemsCount);

    if (count > 0 && count <= 500) {
      // เพิ่ม SweetAlert เด้งถามยืนยันก่อนเริ่มคีย์ราคา
      const { isConfirmed } = await Swal.fire({
        title: "เริ่มบันทึกยอด?",
        html: `ประจำวันที่: <b>${format(currentDate, "d MMMM yyyy", { locale: th })}</b><br/>จำนวนทั้งหมด: <b class="text-blue-600 text-lg">${count} ชิ้น</b>`,
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#2563eb", // สีน้ำเงินให้เข้ากับธีม Business
        cancelButtonColor: "#94a3b8",
        confirmButtonText: "ใช่, เริ่มเลย",
        cancelButtonText: "ยกเลิก",
        reverseButtons: true,
      });

      // ถ้าพนักงานกดยืนยัน ค่อยรันคำสั่งสร้างช่องกรอกข้อมูล
      if (isConfirmed) {
        setItemRates(new Array(count).fill(""));
        setActiveIndex(0);
        goTo({ isSettingUp: false });
      }
    } else {
      // ดักเคสกรอกเลขแปลกๆ หรือเลขติดลบ
      Swal.fire(
        "ข้อมูลไม่ถูกต้อง",
        "กรุณาระบุจำนวนชิ้นระหว่าง 1 - 500 ชิ้น",
        "warning",
      );
    }
  };

  const handleRateSelect = async (rate: number | string) => {
    if (itemRates.length === 0) return;
    const newRates = [...itemRates];
    newRates[activeIndex] = rate.toString();
    setItemRates(newRates);

    // ถนากรอกราคาเองแบบ Custom Mode
    if (isCustomMode && Number(rate) > 0) {
      const numericRate = Number(rate);

      // เช็คว่าเรทนี้ยังไม่มีในปุ่มใช่ไหม? ถ้าไม่มีให้บันทึกลงตารางทันที
      if (!presetRates.includes(numericRate)) {
        await supabase.from("custom_rates").insert({
          user_id: activeProfile.id,
          rate: numericRate,
        });
        fetchRates(); // ดึงข้อมูลใหม่มาอัปเดตปุ่มเรียงใหม่ทันที
      }
      setIsCustomMode(false);
      setCustomRate("");
    }

    if (activeIndex < itemRates.length - 1) setActiveIndex(activeIndex + 1);
  };

  const handleUndo = () => {
    if (activeIndex > 0) {
      const newIndex = activeIndex - 1;
      const newRates = [...itemRates];
      newRates[newIndex] = "";
      setItemRates(newRates);
      setActiveIndex(newIndex);
    } else if (activeIndex === 0) {
      const newRates = [...itemRates];
      newRates[0] = "";
      setItemRates(newRates);
    }
  };

  const handleCancelEntry = () => {
    const hasProgress = itemRates.some((r) => r !== "");
    const doCancel = () => {
      setItemRates([]);
      setTotalItemsCount("");
      itemRatesRef.current = [];
      window.history.back();
    };
    if (hasProgress) {
      Swal.fire({
        title: "ล้างข้อมูลทั้งหมด?",
        text: "ต้องการเริ่มรอบบิลใหม่และล้างข้อมูลที่กรอกไว้หรือไม่",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#94a3b8",
        confirmButtonText: "ล้างข้อมูล",
        cancelButtonText: "ยกเลิก",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) doCancel();
      });
    } else {
      doCancel();
    }
  };

  const confirmSubmit = () => {
    if (filledCount < Number(totalItemsCount)) {
      Swal.fire({
        icon: "warning",
        title: "กรอกไม่ครบ!",
        text: `กรอกข้อมูลไปแค่ ${filledCount} จาก ${totalItemsCount} ชิ้น`,
      });
      return;
    }
    Swal.fire({
      title: "ยืนยันการบันทึก?",
      html: `วันที่: <b>${format(currentDate, "d MMM yyyy", { locale: th })}</b><br/>จำนวนพัสดุ: <b>${totalItemsCount} ชิ้น</b><br/>ยอดรวมบิลนี้: <b>฿${currentTotalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "ตกลง บันทึกเลย!",
      cancelButtonText: "เช็คอีกที",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) handleSubmit();
    });
  };

  const handleSubmit = async () => {
    if (!activeProfile?.id) return;
    setIsLoading(true);

    try {
      const dateStr = format(currentDate, "yyyy-MM-dd");

      // ใช้ .reduce() แทน .map().filter() เพื่อไม่ให้ TypeScript มองเห็นค่า null
      const insertPayload = itemRates.reduce((acc: any[], rate, index) => {
        if (rate !== "" && Number(rate) > 0) {
          acc.push({
            delivery_date: dateStr,
            quantity: 1,
            rate_per_piece: Number(rate),
            item_index: index + 1,
            user_id: activeProfile.id,
          });
        }
        return acc;
      }, []);

      await supabase.from("deliveries").insert(insertPayload);

      Swal.fire({
        icon: "success",
        title: "บันทึกยอดสำเร็จ!",
        showConfirmButton: false,
        timer: 1500,
      });

      setTotalItemsCount("");
      setItemRates([]);
      setIsSettingUp(true);

      window.history.replaceState(
        {
          __app: true,
          tab: "tracker",
          isSettingUp: true,
          selectedDateDetail: null,
        } as NavState,
        "",
      );

      await fetchDeliveriesForDate(currentDate);
    } catch (error) {
      Swal.fire("ผิดพลาด", "บันทึกข้อมูลไม่สำเร็จ", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = async (item: any) => {
    if (!activeProfile?.id) return;
    const confirm1 = await Swal.fire({
      title: "ต้องการแก้ไขยอดนี้?",
      html: `<b>ชิ้นที่ ${item.item_index}</b><br/>ราคาเดิม: ${item.rate_per_piece} บาท`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "ใช่, ต้องการแก้ไข",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
    });
    if (!confirm1.isConfirmed) return;

    const { value: newRate } = await Swal.fire({
      title: `กรอกราคาใหม่`,
      input: "number",
      inputAttributes: { step: "0.01" },
      inputValue: item.rate_per_piece,
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      confirmButtonText: "ยืนยันการแก้ไข!",
      cancelButtonText: "ยกเลิก",
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) return "กรุณาระบุราคาที่ถูกต้อง!";
      },
    });
    if (newRate && Number(newRate) !== Number(item.rate_per_piece)) {
      setIsLoading(true);
      try {
        await supabase.from("delivery_edit_logs").insert({
          delivery_date: item.delivery_date,
          item_index: item.item_index,
          old_rate: item.rate_per_piece,
          new_rate: Number(newRate),
          user_id: activeProfile.id,
        });
        await supabase
          .from("deliveries")
          .update({ rate_per_piece: Number(newRate) })
          .eq("id", item.id);
        Swal.fire({
          icon: "success",
          title: "อัปเดตราคาสำเร็จ!",
          showConfirmButton: false,
          timer: 1500,
        });
        fetchDayDetail(item.delivery_date);
      } catch (error) {
        Swal.fire("ผิดพลาด", "เกิดข้อผิดพลาดในการแก้ไขข้อมูล", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openDayDetail = (dateStr: string) => {
    goTo({ selectedDateDetail: dateStr });
    fetchDayDetail(dateStr);
  };

  // ================= COMPUTED VALUES =================
  const filledCount = itemRates.filter((r) => r !== "").length;
  const currentTotalAmount = itemRates.reduce(
    (sum, val) => sum + (Number(val) || 0),
    0,
  );
  const progressPercent =
    itemRates.length > 0 ? (filledCount / itemRates.length) * 100 : 0;
  const hideBottomNav = activeTab === "tracker" && !isSettingUp;
  const filteredSummary =
    selectedCycle === "ALL"
      ? summaryData
      : summaryData.filter((day) => day.cycle === selectedCycle);

  return {
    activeTab,
    currentDate,
    isSettingUp,
    totalItemsCount,
    setTotalItemsCount,
    itemRates,
    activeIndex,
    setActiveIndex,
    isCustomMode,
    setIsCustomMode,
    customRate,
    setCustomRate,
    presetRates,
    todayTotal,
    availableCycles,
    selectedCycle,
    setSelectedCycle,
    selectedDateDetail,
    dayDetailItems,
    editLogs,
    isLoading,
    activeItemRef,
    filledCount,
    currentTotalAmount,
    progressPercent,
    hideBottomNav,
    filteredSummary,
    startTracking,
    handleRateSelect,
    handleUndo,
    handleCancelEntry,
    confirmSubmit,
    handleEditItem,
    openDayDetail,
    goTo,
  };
}
