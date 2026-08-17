"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import { UserCircle2, Lock, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ดึงเฉพาะพนักงานทั่วไป (role = 'user') และสถานะ approved เท่านั้น (ซ่อนแอดมินเนียนๆ ออกหมด)
  useEffect(() => {
    const fetchApprovedUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'user') // 👈 บังคับดึงเฉพาะยศ user เท่านั้น
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

  // ฟังก์ชันล็อกอินด้วย PIN
  const handleLogin = async (e) => {
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
      console.error("Login error:", error);
      Swal.fire('ผิดพลาด', 'รหัส PIN ไม่ถูกต้อง', 'error');
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        
        {!selectedUser ? (
          <div>
            <h1 className="text-2xl font-black text-center text-slate-800 mb-1">เลือกชื่อผู้ใช้งาน</h1>
            <p className="text-center text-slate-400 text-sm mb-6">แตะที่การ์ดเพื่อเข้าสู่ระบบ</p>
            
            {isLoadingUsers ? (
              <div className="text-center py-10 text-slate-400 font-bold">กำลังโหลดรายชื่อ...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-h-[380px] overflow-y-auto p-1">
                {users.map(u => (
                  <div 
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/40 transition-all active:scale-95 shadow-sm group"
                  >
                    <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserCircle2 className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-slate-800 text-base text-center truncate w-full">{u.username}</span>
                  </div>
                ))}
              </div>
            )}

            {!isLoadingUsers && users.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p className="font-semibold">ยังไม่มีพนักงานในระบบที่ได้รับอนุมัติ</p>
                <p className="text-xs mt-1 text-slate-300">กรุณาให้แอดมินกดอนุมัติสิทธิ์ก่อน</p>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <button 
              onClick={() => { setSelectedUser(null); setPin(""); }}
              className="mb-6 flex items-center gap-1.5 text-slate-500 font-bold text-sm hover:text-slate-800 bg-slate-100 px-4 py-2 rounded-full w-max active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4"/> เปลี่ยนคน
            </button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <UserCircle2 className="w-11 h-11" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">{selectedUser.username}</h2>
              <p className="text-slate-400 text-xs mt-1">กรุณากรอกรหัส PIN 6 หลัก</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  maxLength={6} 
                  autoFocus
                  value={pin} 
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))} 
                  placeholder="------" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-black tracking-[1em] text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-center text-xl" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading || pin.length !== 6}
                className="w-full py-4 mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 disabled:from-slate-200 disabled:to-slate-200 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-md shadow-indigo-100 text-lg"
              >
                {isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยันเข้าสู่ระบบ'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}