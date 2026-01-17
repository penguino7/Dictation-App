import { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { LogIn, UserPlus } from "lucide-react";

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1115] text-white p-4">
      <div className="w-full max-w-md bg-[#1a1d24] p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <h1 className="text-3xl font-black text-center mb-2 text-blue-500">
          Dictation Master
        </h1>
        <p className="text-center text-gray-400 mb-8">
          {isRegister ? "Tạo tài khoản mới" : "Đăng nhập để học tiếp"}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              className="w-full bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isRegister ? (
              <>
                <UserPlus className="w-5 h-5" /> Đăng ký ngay
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" /> Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-gray-400 hover:text-white underline"
          >
            {isRegister
              ? "Đã có tài khoản? Đăng nhập"
              : "Chưa có tài khoản? Đăng ký"}
          </button>
        </div>
      </div>
    </div>
  );
}
