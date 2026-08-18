"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import { UserCircle2, Lock, ArrowLeft, Sparkles } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [clickedUserId, setClickedUserId] = useState<string | null>(null); // State สำหรับควบคุม Morph Animation
  
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

  // ฟังก์ชันรองรับตอนกดเลือกการ์ด (ให้ Morph ก่อนเปลี่ยน State)
  const handleUserClick = (u: any) => {
    setClickedUserId(u.id); // เริ่มเล่นแอนิเมชัน
    setTimeout(() => {
      setSelectedUser(u);
      setClickedUserId(null); // เคลียร์สถานะกดหลังเปลี่ยนหน้าสำเร็จ
    }, 500); // หน่วงเวลา 0.5 วินาทีให้แอนิเมชันเล่นจบ
  };

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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 font-sans relative overflow-hidden">
      
      {/* Animated Glowing Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] w-full max-w-md relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {!selectedUser ? (
          <div className="animate-in fade-in duration-500">
            {/* Header เฟดออกทันทีเวลากดการ์ด */}
            <div className={`text-center mb-8 transition-all duration-500 ease-out ${clickedUserId ? 'opacity-0 -translate-y-4 blur-sm' : 'opacity-100 translate-y-0 blur-none'}`}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.05] border border-white/[0.1] mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-wide mb-2">
                STAFF PORTAL
              </h1>
              <p className="text-slate-400 text-sm font-medium">Select your account to continue</p>
            </div>
            
            {isLoadingUsers ? (
              <div className="text-center py-10 text-indigo-400/70 font-semibold animate-pulse flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                กำลังเชื่อมต่อข้อมูล...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-h-[380px] overflow-y-auto p-1 [&::-webkit-scrollbar]:hidden">
                {users.map(u => {
                  // เช็คว่าการ์ดใบนี้โดนกด หรือใบอื่นโดนกด
                  const isClicked = clickedUserId === u.id;
                  const isOtherClicked = clickedUserId && clickedUserId !== u.id;

                  return (
                    <div 
                      key={u.id} 
                      onClick={() => !clickedUserId && handleUserClick(u)} 
                      className={`
                        relative bg-white/[0.03] border p-5 rounded-2xl flex flex-col items-center justify-center gap-3 
                        cursor-pointer transition-all duration-[500ms] ease-[cubic-bezier(0.23,1,0.32,1)] group overflow-hidden
                        ${isClicked ? 
                          'scale-[1.3] opacity-0 z-50 border-indigo-400 bg-white/[0.1] shadow-[0_0_50px_rgba(99,102,241,0.6)] translate-y-4' 
                          : 'border-white/[0.05] hover:bg-white/[0.08] hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:-translate-y-1'
                        }
                        ${isOtherClicked ? 'scale-75 opacity-0 blur-md pointer-events-none' : ''}
                      `}
                    >
                      {/* ออร่ากระจายตัวตอนคลิก */}
                      {isClicked && (
                        <div className="absolute inset-0 bg-indigo-500/40 rounded-2xl animate-[ping_0.5s_ease-out_forwards]" />
                      )}
                      
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-500 ring-1 shadow-inner
                        ${isClicked ? 'bg-indigo-500/30 text-white ring-indigo-400 scale-110' : 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-300 ring-white/10 group-hover:scale-110 group-hover:ring-indigo-500/50'}
                      `}>
                        <UserCircle2 className="w-7 h-7" />
                      </div>
                      <span className={`font-semibold text-sm tracking-wide text-center truncate w-full transition-colors duration-300
                        ${isClicked ? 'text-white' : 'text-slate-200 group-hover:text-white'}
                      `}>
                        {u.username}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // แอนิเมชันซูมเข้าของหน้า PIN เหมือนการ์ดขยายร่างมา
          <div className="animate-in fade-in zoom-in-50 duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
            <button 
              onClick={() => { setSelectedUser(null); setPin(""); }} 
              className="mb-8 flex items-center gap-2 text-slate-400 font-medium text-sm hover:text-white bg-white/[0.03] hover:bg-white/[0.08] px-4 py-2 rounded-xl border border-white/[0.05] transition-all duration-300 w-fit active:scale-95"
            >
              <ArrowLeft className="w-4 h-4"/> Back
            </button>
            
            <div className="text-center mb-8 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-300 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(99,102,241,0.3)] backdrop-blur-md">
                <UserCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-wide">{selectedUser.username}</h2>
              <p className="text-indigo-300/70 text-xs mt-2 font-medium tracking-widest uppercase">Enter Access PIN</p>
            </div>

            <form onSubmit={handleUserLogin} className="space-y-6 relative z-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-25 group-focus-within:opacity-60 transition-opacity duration-300" />
                <div className="relative flex items-center">
                  <Lock className="absolute left-5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-300 transition-colors" />
                  <input 
                    type="password" 
                    maxLength={6} 
                    autoFocus 
                    value={pin} 
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))} 
                    placeholder="••••••" 
                    className="w-full bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-xl py-4 pl-14 pr-4 font-black tracking-[0.7em] text-white outline-none focus:border-indigo-400/60 focus:bg-[#0a0a0a] transition-all text-center text-xl shadow-inner placeholder:tracking-normal placeholder:text-slate-600" 
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading || pin.length !== 6} 
                className="relative w-full py-4 mt-2 bg-white text-black disabled:bg-white/10 disabled:text-white/30 font-black tracking-wide rounded-xl active:scale-[0.98] transition-all overflow-hidden group disabled:shadow-none shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              >
                {!isLoading && pin.length === 6 && (
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                )}
                <span className="relative">
                  {isLoading ? 'VERIFYING...' : 'UNLOCK'}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}