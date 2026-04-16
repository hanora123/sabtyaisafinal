"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Role = { id: string; name: string };
type User = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  status: 'ACTIVE' | 'INACTIVE';
  userRoles: { role: Role }[];
};

export default function UsersPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [users, setUsers] = useState<User[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isUpdating, setIsUpdating] = useState(false);

  async function loadData() {
    setIsLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        fetch(`${apiBase}/v1/users`, { credentials: "include" }),
        fetch(`${apiBase}/v1/auth/roles`, { credentials: "include" })
      ]);

      if (uRes.status === 401) {
        router.push("/login");
        return;
      }
      if (uRes.ok) setUsers(await uRes.json());
      if (rRes.ok) setAllRoles(await rRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (u: User) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditRoles(u.userRoles.map(ur => ur.role.name));
    setEditStatus(u.status);
  };

  const closeEdit = () => {
    setEditingUser(null);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`${apiBase}/v1/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          fullName: editFullName,
          roles: editRoles,
          status: editStatus
        })
      });

      if (res.ok) {
        await loadData();
        closeEdit();
      } else {
        alert("فشل تحديث المستخدم");
      }
    } catch (e) {
      console.error(e);
      alert("خطأ في الاتصال");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleRole = (roleName: string) => {
    setEditRoles(prev => 
      prev.includes(roleName) 
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    );
  };

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>إدارة المستخدمين والأدوار</h1>
      </div>

      <div style={{ marginBottom: 16 }}>
        <a href="/admin" style={{ color: "var(--brand-blue)", textDecoration: "none" }}>&larr; العودة للوحة الإدارة</a>
      </div>

      {isLoading ? (
        <p>جاري تحميل البيانات...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", textAlign: "right" }}>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>الاسم</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>اسم المستخدم</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>البريد</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>الأدوار</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>الحالة</th>
                <th style={{ padding: 12, borderBottom: "2px solid var(--border)" }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: 12, fontWeight: 500 }}>{u.fullName}</td>
                  <td style={{ padding: 12 }}>{u.username}</td>
                  <td style={{ padding: 12 }}>{u.email}</td>
                  <td style={{ padding: 12 }}>
                    {u.userRoles.map(ur => (
                      <span key={ur.role.id} style={{
                        background: "var(--surface-2)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 12,
                        marginInlineEnd: 4,
                        border: "1px solid var(--border)"
                      }}>
                        {ur.role.name}
                      </span>
                    ))}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      background: u.status === 'ACTIVE' ? "#e6f4ea" : "#fce8e6",
                      color: u.status === 'ACTIVE' ? "#1e8e3e" : "#d93025"
                    }}>
                      {u.status === 'ACTIVE' ? "نشط" : "معطل"}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    <button 
                      onClick={() => openEdit(u)}
                      style={{ padding: "4px 8px", cursor: "pointer", borderRadius: 4, border: "1px solid var(--brand-blue)", color: "var(--brand-blue)", background: "transparent" }}
                    >
                      تعديل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--surface)', padding: 24, borderRadius: 12, width: '100%', maxWidth: 450,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ marginBottom: 16 }}>تعديل المستخدم: {editingUser.username}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span>الاسم الكامل</span>
                <input 
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
                />
              </label>

              <div>
                <span style={{ display: 'block', marginBottom: 8 }}>الأدوار</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {allRoles.map(role => (
                    <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={editRoles.includes(role.name)}
                        onChange={() => toggleRole(role.name)}
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span>الحالة</span>
                <select 
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
                >
                  <option value="ACTIVE">نشط</option>
                  <option value="INACTIVE">معطل</option>
                </select>
              </label>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button 
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  style={{
                    flex: 1, padding: 10, borderRadius: 8, border: 'none',
                    background: 'var(--brand-blue)', color: '#fff', cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isUpdating ? "جاري التحديث..." : "حفظ التغييرات"}
                </button>
                <button 
                  onClick={closeEdit}
                  style={{
                    padding: 10, borderRadius: 8, border: '1px solid var(--border)',
                    background: 'transparent', cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
