
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  role?: string;
  organization_id?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserProfile = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return profile;
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: profile?.role,
          organization_id: profile?.organization_id
        });

        // Redirect based on role and organization
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else if (profile?.organization_id) {
          navigate('/dashboard');
        }
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: profile?.role,
          organization_id: profile?.organization_id
        });

        // Redirect based on role and organization
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else if (profile?.organization_id) {
          navigate('/dashboard');
        }
      } else {
        setUser(null);
        navigate('/login');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        
        setUser({
          id: data.user.id,
          email: data.user.email!,
          role: profile?.role,
          organization_id: profile?.organization_id
        });

        // Redirect based on role and organization
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else if (profile?.organization_id) {
          navigate('/dashboard');
        } else {
          toast.error("Ingen organisasjon tilknyttet");
        }

        toast.success("Innlogget");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Kunne ikke logge inn");
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      navigate('/login');
      toast.success("Logget ut");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error("Kunne ikke logge ut");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
