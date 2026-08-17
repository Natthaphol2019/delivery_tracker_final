"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Swal from "sweetalert2";
import {
  Users,
  ClipboardEdit,
  CheckCircle2,
  Clock,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  UserCircle2,
  Database,
  Trash2,
  Edit2,
  XCircle
} from "lucide-react";

export default function AdminDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("manage"); // 'manage', 'kiosk', 'history'

  // สำหรับโหมด Kiosk
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rate, setRate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/admin/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
        
      if (profile?.role !== "admin") return router.push("/");

      setIsAdmin(true);
      fetchUsers();
    };
    initAuth();
  }, [router, supabase]);

  // ดึงข้อมูลเมื่อเปลี่ยนแท็บไปหน้า History และรีเซ็ตโหมด Kiosk ถ้าเปลี่ยนแท็บ
  useEffect(() => {
    if (activeTab === "history") fetchDeliveries();
    if (activeTab !== "kiosk") {
      setSelectedUser(null);
      setRate("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("role", "admin")
      .order("created_at", { ascending: false });
    setUsers(data || []);
  };

  // ================= (R) READ: ดึงประวัติยอดจัดส่งทั้งหมด =================
  const fetchDeliveries = async () => {
    const { data } = await supabase
      .from("deliveries")
      .select("*, profiles(username)")
      .order("created_at", { ascending: false })
      .limit(50);
    setDeliveries(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // ================= 1. ฟังก์ชันจัดการสิทธิ์ผู้ใช้ =================
  const toggleStatus = async (id: string, currentStatus: string, username: string) => {
    const newStatus = currentStatus === "approved" ? "pending" : "approved";
    const actionText = newStatus === "approved" ? "อนุมัติ" : "ระงับ";

    const { isConfirmed } = await Swal.fire({
      title: `ยืนยันการ${actionText}?`,
      text: `ต้องการ${actionText}ผู้ใช้ ${username}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: newStatus === "approved" ? "#2563eb" : "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: `ใช่, ${actionText}`,
      cancelButtonText: "ยกเลิก"
    });

    if (isConfirmed) {
      await supabase.from("profiles").update({ status: newStatus }).eq("id", id);
      fetchUsers();
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: `อัปเดตสถานะ ${username} เรียบร้อย`,
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  // ================= (C) CREATE: คีย์ยอดแทนลูกน้อง (โหมด Kiosk) =================
  const handleSaveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rate || !selectedUser) return;

    setIsSaving(true);
    const dateStr = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("deliveries").insert([
      {
        delivery_date: dateStr,
        quantity: 1,
        rate_per_piece: Number(rate),
        user_id: selectedUser.id,
      },
    ]);

    setIsSaving(false);
    if (error) {
      Swal.fire("ผิดพลาด", "บันทึกข้อมูลไม่สำเร็จ", "error");
    } else {
      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ!",
        text: `ลงยอดให้ ${selectedUser.username} เรียบร้อย`,
        showConfirmButton: false,
        timer: 1500,
      });
      setRate("");
    }
  };

  // ================= (U) UPDATE: แก้ไขราคาจัดส่ง =================
  const handleEditDelivery = async (item: any) => {
    const { value: newRate } = await Swal.fire({
      title: "แก้ไขราคาจัดส่ง",
      html: `ของ <b>${item.profiles?.username}</b><br/><span class="text-sm text-slate-500">วันที่ ${format(new Date(item.delivery_date), "d MMM yy", { locale: th })}</span>`,
      input: "number",
      inputValue: item.rate_per_piece,
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "บันทึกการแก้ไข",
      cancelButtonText: "ยกเลิก",
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) return 'กรุณาระบุราคาที่ถูกต้อง';
      }
    });

    if (newRate && Number(newRate) !== Number(item.rate_per_piece)) {
      const { error } = await supabase
        .from("deliveries")
        .update({ rate_per_piece: Number(newRate) })
        .eq("id", item.id);
      if (!error) {
        Swal.fire({
          icon: "success",
          title: "อัปเดตราคาสำเร็จ",
          showConfirmButton: false,
          timer: 1000,
        });
        fetchDeliveries();
      }
    }
  };

  // ================= (D) DELETE: ลบรายการจัดส่ง =================
  const handleDeleteDelivery = async (id: string) => {
    const { isConfirmed } = await Swal.fire({
      title: "ลบรายการนี้?",
      text: "ข้อมูลที่ลบจะไม่สามารถกู้คืนได้!",
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "ใช่, ลบทิ้งเลย",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true
    });

    if (isConfirmed) {
      await supabase.from("deliveries").delete().eq("id", id);
      Swal.fire({
        icon: "success",
        title: "ลบข้อมูลสำเร็จ",
        showConfirmButton: false,
        timer: 1000,
      });
      fetchDeliveries();
    }
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">กำลังตรวจสอบสิทธิ์...</div>;

  const pendingUsers = users.filter((u) => u.status === "pending");
  const approvedUsers = users.filter((u) => u.status === "approved");

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col pb-10">
      
      {/* Header (Business Theme) */}
      <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg border border-blue-500 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider">Admin Portal</h1>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest">Management System</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-slate-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5">
          <LogOut className="w-4 h-4" /> ออกจากระบบ
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 flex-1 flex flex-col mt-2">
        
        {/* เมนูเปลี่ยนหน้า (Tabs) */}
        {!selectedUser && (
          <div className="flex bg-white rounded-xl shadow-sm p-1.5 mb-6 border border-slate-200">
            <button
              onClick={() => setActiveTab("manage")}
              className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 relative ${activeTab === "manage" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Users className="w-4 h-4" /> สิทธิ์พนักงาน
              {pendingUsers.length > 0 && (
                <span className="absolute top-2 right-2 md:right-6 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("kiosk")}
              className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "kiosk" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <ClipboardEdit className="w-4 h-4" /> คีย์ยอด
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "history" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Database className="w-4 h-4" /> ประวัติระบบ
            </button>
          </div>
        )}

        {/* ================= แท็บที่ 1: จัดการสิทธิ์ ================= */}
        {activeTab === "manage" && !selectedUser && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">รายชื่อพนักงานทั้งหมด ({users.length})</h2>
              <p className="text-sm text-slate-500 mt-0.5">อนุมัติหรือระงับสิทธิ์การใช้งานของพนักงาน</p>
            </div>
            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl border border-blue-100">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{u.username}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">สมัครเมื่อ: {format(new Date(u.created_at), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStatus(u.id, u.status, u.username)}
                    className={`px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${u.status === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" : "bg-slate-800 text-white border border-slate-900 hover:bg-slate-700"}`}
                  >
                    {u.status === "approved" ? (
                      <><CheckCircle2 className="w-4 h-4" /> ใช้งานได้</>
                    ) : (
                      <><Clock className="w-4 h-4" /> รออนุมัติ</>
                    )}
                  </button>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-center text-slate-400 py-10 font-medium">ยังไม่มีพนักงานในระบบ</p>
              )}
            </div>
          </div>
        )}

        {/* ================= แท็บที่ 2: Kiosk (เลือกลูกน้อง) ================= */}
        {activeTab === "kiosk" && !selectedUser && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">เลือกลูกน้องที่ต้องการคีย์ยอด</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {approvedUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all active:bg-slate-50 group"
                >
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UserCircle2 className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{u.username}</span>
                </div>
              ))}
              {approvedUsers.length === 0 && (
                <div className="col-span-full p-8 text-center border border-slate-200 bg-white rounded-xl text-slate-400 font-medium">
                  ยังไม่มีพนักงานที่ได้รับอนุมัติ
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= แท็บที่ 2: Kiosk (ฟอร์มคีย์ตัวเลข) ================= */}
        {selectedUser && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => { setSelectedUser(null); setRate(""); }}
              className="mb-4 flex items-center gap-2 text-slate-500 font-semibold hover:text-slate-800 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 active:bg-slate-50 transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> เปลี่ยนพนักงาน
            </button>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-lg mb-8 font-semibold text-sm">
                <ClipboardEdit className="w-4 h-4" /> ลงยอดด่วนให้: {selectedUser.username}
              </div>
              <form onSubmit={handleSaveDelivery}>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-center text-5xl font-bold text-slate-800 border-b-2 border-slate-200 pb-4 mb-8 outline-none focus:border-blue-600 placeholder:text-slate-300 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!rate || isSaving}
                  className="w-full bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-transparent text-white py-4 rounded-lg font-bold text-base shadow-sm active:scale-95 transition-all"
                >
                  {isSaving ? "กำลังบันทึก..." : "บันทึกยอดจัดส่ง"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= แท็บที่ 3: ประวัติ & แก้ไขข้อมูล (CRUD) ================= */}
        {activeTab === "history" && !selectedUser && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">ประวัติการลงยอด</h2>
                <p className="text-sm text-slate-500 mt-0.5">แสดงข้อมูล 50 รายการล่าสุดในระบบ</p>
              </div>
              <button onClick={fetchDeliveries} className="text-blue-600 text-sm font-semibold hover:underline bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 active:bg-blue-100">
                รีเฟรชข้อมูล
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {deliveries.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-800 text-sm">{item.profiles?.username || "ไม่ทราบชื่อ"}</span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold border border-blue-100">
                        ฿{item.rate_per_piece}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {format(new Date(item.created_at), "dd MMM yy, HH:mm", { locale: th })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditDelivery(item)}
                      className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-blue-400 hover:text-blue-600 active:bg-slate-50 transition-all shadow-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDelivery(item.id)}
                      className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-red-400 hover:text-red-600 active:bg-slate-50 transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {deliveries.length === 0 && (
                <div className="p-10 text-center text-slate-400 font-medium flex flex-col items-center">
                  <Database className="w-10 h-10 text-slate-200 mb-3" />
                  ยังไม่มีข้อมูลการจัดส่ง
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}