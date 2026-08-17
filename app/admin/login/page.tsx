"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import { ShieldAlert, UserCircle2, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [adminUsername, setAdminUsername] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername || pin.length !== 6) {
      return Swal.fire('แจ้งเตือน', 'กรุณากรอกชื่อและรหัส PIN ให้ครบถ้วน', 'warning');
    }
    
    setIsLoading(true);
    const email = `${adminUsername.toLowerCase().trim()}@delivery.local`;
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pin });
      if (error) throw error;

      // ตรวจสอบว่าเป็นแอดมินจริงหรือไม่
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role === 'admin') {
          router.push("/admin"); // ทะลุเข้าหลังบ้าน
        } else {
          // ไม่ใช่แอดมิน เตะออกทันที
          await supabase.auth.signOut();
          Swal.fire('ปฏิเสธการเข้าถึง', 'บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ', 'error');
        }
      }
    } catch (error) {
      console.error("Admin Login error:", error);
      Swal.fire('ผิดพลาด', 'ชื่อผู้ดูแลระบบหรือรหัส PIN ไม่ถูกต้อง', 'error');
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
        
        <div className="text-center mb-8 mt-2">
          <div className="w-20 h-20 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-slate-900/20 rotate-3">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wider">Admin Portal</h1>
          <p className="text-slate-500 text-sm mt-1">ระบบจัดการสำหรับผู้ดูแล</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="relative">
            <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              autoFocus
              value={adminUsername} 
              onChange={e => setAdminUsername(e.target.value)} 
              placeholder="Username (เช่น admin)" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 font-semibold text-slate-800 outline-none focus:border-slate-800 focus:bg-white transition-all" 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="password" 
              maxLength={6} 
              value={pin} 
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))} 
              placeholder="PIN 6 หลัก" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 font-black tracking-[0.5em] text-slate-800 outline-none focus:border-slate-800 focus:bg-white transition-all" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !adminUsername || pin.length !== 6}
            className="w-full py-4 mt-2 bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md text-lg"
          >
            {isLoading ? 'กำลังตรวจสอบ...' : 'Secure Login'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <Link href="/login" className="text-sm font-semibold text-slate-400 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 mx-auto">
            <ArrowLeft className="w-4 h-4" /> กลับหน้าผู้ใช้งานทั่วไป
          </Link>
        </div>
      </div>
    </div>
  );
}