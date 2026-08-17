"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Swal from 'sweetalert2';
import { Users, ClipboardEdit, CheckCircle2, Clock, ArrowLeft, LogOut, ShieldCheck, UserCircle2, Database, Trash2, Edit2 } from "lucide-react";

export default function AdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  
  const [users, setUsers] = useState([]);
  const [deliveries, setDeliveries] = useState([]); // 👈 สเตทสำหรับเก็บประวัติ (CRUD)
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("manage"); // 'manage', 'kiosk', 'history'
  
  // สำหรับโหมด Kiosk
  const [selectedUser, setSelectedUser] = useState(null);
  const [rate, setRate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile?.role !== 'admin') return router.push('/');
      
      setIsAdmin(true);
      fetchUsers();
    };
    initAuth();
  }, [router, supabase]);

  // ดึงข้อมูลเมื่อเปลี่ยนแท็บไปหน้า History
  useEffect(() => {
    if (activeTab === 'history') fetchDeliveries();
  }, [activeTab]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false });
    setUsers(data || []);
  };

  // ================= (R) READ: ดึงประวัติยอดจัดส่งทั้งหมด =================
  const fetchDeliveries = async () => {
    const { data } = await supabase
      .from('deliveries')
      .select('*, profiles(username)') // จอยตารางเพื่อเอาชื่อพนักงานมาแสดงด้วย
      .order('created_at', { ascending: false })
      .limit(50); // โชว์ 50 รายการล่าสุด
    setDeliveries(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // ================= 1. ฟังก์ชันจัดการสิทธิ์ผู้ใช้ =================
  const toggleStatus = async (id, currentStatus, username) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    const actionText = newStatus === 'approved' ? 'ระงับ' : 'อนุมัติ';
    
    const { isConfirmed } = await Swal.fire({
      title: `ยืนยันการ${actionText}?`, text: `ต้องการ${actionText}ผู้ใช้ ${username}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: newStatus === 'approved' ? '#10b981' : '#ef4444'
    });

    if (isConfirmed) {
      await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
      fetchUsers();
      Swal.fire('สำเร็จ', `อัปเดตสถานะ ${username} เรียบร้อย`, 'success');
    }
  };

  // ================= (C) CREATE: คีย์ยอดแทนลูกน้อง (โหมด Kiosk) =================
  const handleSaveDelivery = async (e) => {
    e.preventDefault();
    if (!rate || !selectedUser) return;
    
    setIsSaving(true);
    const dateStr = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase.from("deliveries").insert([{
      delivery_date: dateStr, quantity: 1, rate_per_piece: Number(rate), user_id: selectedUser.id
    }]);

    setIsSaving(false);
    if (error) {
      Swal.fire('ผิดพลาด', 'บันทึกข้อมูลไม่สำเร็จ', 'error');
    } else {
      Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ!', text: `ลงยอดให้ ${selectedUser.username}`, showConfirmButton: false, timer: 1500 });
      setRate(""); 
    }
  };

  // ================= (U) UPDATE: แก้ไขราคาจัดส่ง =================
  const handleEditDelivery = async (item) => {
    const { value: newRate } = await Swal.fire({
      title: 'แก้ไขราคาจัดส่ง',
      text: `ของ ${item.profiles?.username} (วันที่ ${format(new Date(item.delivery_date), "d MMM yy", { locale: th })})`,
      input: 'number',
      inputValue: item.rate_per_piece,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก'
    });

    if (newRate && Number(newRate) !== Number(item.rate_per_piece)) {
      const { error } = await supabase.from('deliveries').update({ rate_per_piece: Number(newRate) }).eq('id', item.id);
      if (!error) {
        Swal.fire({ icon: 'success', title: 'อัปเดตสำเร็จ', showConfirmButton: false, timer: 1000 });
        fetchDeliveries(); // โหลดข้อมูลใหม่
      }
    }
  };

  // ================= (D) DELETE: ลบรายการจัดส่ง =================
  const handleDeleteDelivery = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'ลบรายการนี้?',
      text: 'ข้อมูลที่ลบจะไม่สามารถกู้คืนได้!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ใช่, ลบทิ้งเลย',
      cancelButtonText: 'ยกเลิก'
    });

    if (isConfirmed) {
      await supabase.from('deliveries').delete().eq('id', id);
      Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', showConfirmButton: false, timer: 1000 });
      fetchDeliveries(); // โหลดข้อมูลใหม่
    }
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-bold">กำลังตรวจสอบสิทธิ์...</div>;

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10">
      <div className="bg-slate-900 text-white p-6 shadow-lg">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-xl"><ShieldCheck className="w-8 h-8" /></div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-widest">Admin Control</h1>
              <p className="text-slate-400 text-xs">ระบบจัดการกลาง</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 p-3 rounded-full transition-all"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 mt-4">
        
        {/* เมนูเปลี่ยนหน้า (Tabs) */}
        {!selectedUser && (
          <div className="flex bg-white rounded-2xl shadow-sm p-1 mb-6 border border-slate-200">
            <button onClick={() => setActiveTab('manage')} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all relative ${activeTab === 'manage' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              👥 จัดการสิทธิ์
              {pendingUsers.length > 0 && <span className="absolute top-2 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
            </button>
            <button onClick={() => setActiveTab('kiosk')} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all ${activeTab === 'kiosk' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              📦 คีย์ยอด
            </button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Database className="w-4 h-4 inline mb-1" /> ประวัติ (CRUD)
            </button>
          </div>
        )}

        {/* ================= หน้าต่าง: จัดการสิทธิ์ ================= */}
        {activeTab === 'manage' && !selectedUser && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b font-bold text-slate-500 text-sm">รายชื่อพนักงานทั้งหมด ({users.length})</div>
            <div className="divide-y divide-slate-100">
              {users.map(u => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="font-bold text-lg text-slate-700">{u.username}</div>
                  <button onClick={() => toggleStatus(u.id, u.status, u.username)} className={`px-4 py-2 rounded-xl font-bold text-sm text-white transition-transform flex items-center gap-1 ${u.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                    {u.status === 'approved' ? <><CheckCircle2 className="w-4 h-4"/> ใช้งานได้</> : <><Clock className="w-4 h-4"/> รออนุมัติ</>}
                  </button>
                </div>
              ))}
              {users.length === 0 && <p className="text-center text-slate-400 py-10 font-medium">ยังไม่มีพนักงานในระบบ</p>}
            </div>
          </div>
        )}

        {/* ================= หน้าต่าง: Kiosk (เลือกลูกน้อง) ================= */}
        {activeTab === 'kiosk' && !selectedUser && (
          <div>
            <h2 className="text-lg font-black text-slate-800 mb-4 px-2">เลือกลูกน้องที่ต้องการลงยอด</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {approvedUsers.map(u => (
                <div key={u.id} onClick={() => setSelectedUser(u)} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center gap-3 cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all active:scale-95">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center"><UserCircle2 className="w-8 h-8" /></div>
                  <span className="font-bold text-slate-800">{u.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= หน้าต่าง: Kiosk (ฟอร์มคีย์ตัวเลข) ================= */}
        {selectedUser && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <button onClick={() => { setSelectedUser(null); setRate(""); }} className="mb-4 flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 active:scale-95">
              <ArrowLeft className="w-4 h-4"/> กลับไปหน้าเลือกคน
            </button>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full mb-6 font-bold text-sm">
                <ClipboardEdit className="w-4 h-4" /> ลงยอดให้: {selectedUser.username}
              </div>
              <form onSubmit={handleSaveDelivery}>
                <input type="number" step="0.01" autoFocus value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0.00" className="w-full text-center text-6xl font-black text-indigo-600 border-b-2 border-slate-200 pb-4 mb-8 outline-none focus:border-indigo-500" />
                <button type="submit" disabled={!rate || isSaving} className="w-full bg-slate-900 disabled:bg-slate-300 text-white py-4 rounded-xl font-bold text-lg shadow-md">
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกยอดชิ้นนี้'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= หน้าต่าง: ประวัติ & แก้ไขข้อมูล (CRUD) ================= */}
        {activeTab === 'history' && !selectedUser && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 bg-slate-50 border-b font-bold text-slate-500 text-sm flex justify-between items-center">
                <span>ประวัติการลงยอด (50 รายการล่าสุด)</span>
                <button onClick={fetchDeliveries} className="text-indigo-600 text-xs hover:underline">รีเฟรช</button>
             </div>
             <div className="divide-y divide-slate-100">
                {deliveries.map(item => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        {item.profiles?.username || 'ไม่ทราบชื่อ'} 
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">฿{item.rate_per_piece}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{format(new Date(item.created_at), "dd MMM yy, HH:mm", { locale: th })}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditDelivery(item)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 active:scale-95"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteDelivery(item.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:scale-95"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {deliveries.length === 0 && <p className="text-center text-slate-400 py-10 font-medium">ยังไม่มีข้อมูลการจัดส่ง</p>}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}