"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import { UserCircle2, Lock, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchApprovedUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'user')
          .eq('status', 'approved');
        
        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchApprovedUsers();
  }, [supabase]);

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || pin.length !== 6) {
      return Swal.fire('แจ้งเตือน', 'กรุณากรอกรหัส PIN 6 หลักให้ครบ', 'warning');
    }
    
    setIsLoading(true);
    const email = `${selectedUser.username.toLowerCase().trim()}@delivery.local`;
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pin });
      if (error) throw error;
      router.push("/");
    } catch (error) {
      Swal.fire('ผิดพลาด', 'รหัส PIN ไม่ถูกต้อง', 'error');
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 w-full max-w-md relative overflow-hidden">
        
        {!selectedUser ? (
          <div className="animate-in fade-in duration-300">
            <h1 className="text-2xl font-bold text-center text-slate-800 mb-1">เลือกชื่อผู้ใช้งาน</h1>
            <p className="text-center text-slate-500 text-sm mb-6">แตะที่การ์ดเพื่อเข้าสู่ระบบพนักงาน</p>
            
            {isLoadingUsers ? (
              <div className="text-center py-10 text-slate-400 font-semibold">กำลังโหลดรายชื่อ...</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto p-1">
                {users.map(u => (
                  <div key={u.id} onClick={() => setSelectedUser(u)} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all active:bg-slate-50 group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform"><UserCircle2 className="w-6 h-6" /></div>
                    <span className="font-bold text-slate-800 text-sm text-center truncate w-full">{u.username}</span>
                  </div>
                ))}
              </div>
            )}

            {!isLoadingUsers && users.length === 0 && (
              <div className="text-center py-12 text-slate-400 border border-slate-100 rounded-xl bg-slate-50 mt-2">
                <p className="font-medium text-sm">ยังไม่มีพนักงานที่ได้รับอนุมัติ</p>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button onClick={() => { setSelectedUser(null); setPin(""); }} className="mb-6 flex items-center gap-1.5 text-slate-500 font-semibold text-sm hover:text-slate-800 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 transition-all"><ArrowLeft className="w-4 h-4"/> เปลี่ยนคน</button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><UserCircle2 className="w-8 h-8" /></div>
              <h2 className="text-xl font-bold text-slate-800">{selectedUser.username}</h2>
              <p className="text-slate-500 text-xs mt-1">กรุณากรอกรหัส PIN 6 หลัก</p>
            </div>

            <form onSubmit={handleUserLogin} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="password" maxLength={6} autoFocus value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="------" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 font-black tracking-[0.5em] text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all text-center text-lg" />
              </div>
              <button type="submit" disabled={isLoading || pin.length !== 6} className="w-full py-3.5 mt-2 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl active:scale-95 transition-all shadow-sm">{isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยันเข้าสู่ระบบ'}</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}