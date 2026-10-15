"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { api } from "@/lib/api";
import { HOME } from "@/lib/roles";

const NAME = { resident: "User", volunteer: "Volunteer", authority: "Admin" };
const HINT = {
  resident: "Report flooding, find shelter and request aid.",
  volunteer: "Accept and complete assigned assistance tasks.",
  authority: "Verify reports, draw flood zones and manage relief centers.",
};

export default function AuthForm({ register = false }) {
  const { msg, setUser } = useApp();
  const router = useRouter();
  const roles = register ? ["resident", "volunteer"] : Object.keys(NAME); // admins can't self-register
  const [role, setRole] = useState("resident");
  const [f, setF] = useState({ name: "", contact: "", password: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    try {
      const b = { contact: f.contact, password: f.password, role };
      if (register) b.name = f.name;
      const d = await api("/auth/" + (register ? "register" : "login"), {
        m: "POST",
        b,
      });
      setUser(d.user);
      router.replace(HOME[d.user.role]);
    } catch (e) {
      msg(e.message);
    }
  }

  return (
    <div id="lg">
      <div className="lbox">
        <h2>🌊 FloodSafe</h2>
        <p className="m">One verified map for flood response</p>
        <div className="tabs">
          {roles.map((r) => (
            <button
              key={r}
              className={role === r ? "on" : ""}
              onClick={() => setRole(r)}
            >
              {NAME[r]}
            </button>
          ))}
        </div>
        <form className="lform" onSubmit={submit}>
          <p className="m">{HINT[role]}</p>
          {register && (
            <>
              <label>Full name</label>
              <input
                value={f.name}
                onChange={set("name")}
                autoComplete="name"
                required
              />
            </>
          )}
          <label>Username (phone or email)</label>
          <input
            value={f.contact}
            onChange={set("contact")}
            autoComplete="username"
            required
          />
          <label>Password</label>
          <input
            type="password"
            value={f.password}
            onChange={set("password")}
            autoComplete={register ? "new-password" : "current-password"}
            minLength={register ? 6 : undefined}
            required
          />
          <button type="submit" style={{ width: "100%", margin: "6px 0" }}>
            {register
              ? "Create " + NAME[role] + " account"
              : "Login as " + NAME[role]}
          </button>
          {/* the <p> with the Register/Login link and the guest link stay exactly as they are */}
        </form>
      </div>
    </div>
  );
}
