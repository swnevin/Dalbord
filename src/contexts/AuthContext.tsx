
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface User {
  email: string;
  role: "admin" | "client";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    if (password !== "123456") {
      toast.error("Ugyldig innloggingsinformasjon");
      return;
    }

    let user: User;
    if (email === "admin@example.com") {
      user = { email, role: "admin" };
      navigate("/admin");
    } else if (email === "client@example.com") {
      user = { email, role: "client" };
      navigate("/client");
    } else {
      toast.error("Ugyldig innloggingsinformasjon");
      return;
    }

    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    toast.success("Innlogget");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login");
    toast.success("Logget ut");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
