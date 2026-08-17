"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Clock, UserCircle2, LogOut } from "lucide-react";
import { useDelivery } from "@/hooks/useDelivery";
import { TrackerTab, SummaryTab, HistoryTab, BottomNav } from "@/components/DeliveryTabs";

export default function AppMainPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // ตรวจสอบสิทธิ์ (Auth Guard)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/login"); return; }

        const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single(); 
        
        // ถ้าเป็น Admin เด้งไปหน้าแอดมิน
        if (userProfile?.role === 'admin') {
          router.push("/admin");
          return;
        }
        
        setProfile(userProfile);
      } catch (err) {
        console.error(err);
      } finally {
        setIsInitializing(false);
      }
    };
    checkAuth();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isInitializing) return <div className="min-h-screen flex items-center justify-center bg-indigo-50 font-sans text-indigo-600 font-bold">กำลังโหลดแอปพลิเคชัน...</div>;

  // ถ้าบัญชียังไม่อนุมัติ
  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 max-w-sm w-full">
          <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">รอผู้ดูแลระบบอนุมัติ</h2>
          <p className="text-slate-500 text-sm mb-6">กรุณาแจ้งแอดมินเพื่อเปิดสิทธิ์การใช้งาน</p>
          <button onClick={handleLogout} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">ออกจากระบบ</button>
        </div>
      </div>
    );
  }

  // เรียกใช้ TrackerApp โดยส่ง Profile เข้าไป
  return <TrackerApp profile={profile} onLogout={handleLogout} />;
}

// ================= คอมโพเนนต์หลักที่ประกอบร่างแอป =================
function TrackerApp({ profile, onLogout }: { profile: any, onLogout: () => void }) {
  // เรียกใช้ Custom Hook ตัวเดียวจบ
  const delivery = useDelivery(profile);
  const displayName = profile?.username || "กำลังโหลด...";

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col pb-24 relative overflow-x-hidden">
      
      {/* Header ของพนักงาน */}
      <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <UserCircle2 className="w-5 h-5"/> 
          <span className="font-bold uppercase">{displayName}</span>
        </div>
        <button onClick={onLogout} className="text-indigo-200 hover:text-white text-xs font-bold transition-colors">
          <LogOut className="w-4 h-4 inline" /> ออกจากระบบ
        </button>
      </div>

      {/* ควบคุมการเปลี่ยนหน้าต่างด้วย State Active Tab */}
      {delivery.activeTab === 'tracker' && <TrackerTab delivery={delivery} />}
      {delivery.activeTab === 'summary' && <SummaryTab delivery={delivery} />}
      {delivery.activeTab === 'history' && <HistoryTab delivery={delivery} />}

      {/* เมนูด้านล่างสุด */}
      <BottomNav delivery={delivery} />
    </div>
  );
}