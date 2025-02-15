
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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const handleSession = async (session: any) => {
    if (!session?.user) {
      setUser(null);
      navigate('/login');
      return;
    }

    try {
      const profile = await fetchUserProfile(session.user.id);
      
      if (!profile) {
        console.error('No profile found');
        setUser(null);
        navigate('/login');
        return;
      }

      const userData = {
        id: session.user.id,
        email: session.user.email,
        role: profile.role,
        organization_id: profile.organization_id
      };

      setUser(userData);

      if (profile.role === 'admin' && profile.organization_id === 'f8796b61-37a1-4727-8e4e-e6262a1a8185') {
        navigate('/admin');
      } else if (profile.organization_id) {
        navigate('/dashboard');
      } else {
        toast.error('Ingen organisasjon tilknyttet');
        setUser(null);
        navigate('/login');
      }
    } catch (error) {
      console.error('Error handling session:', error);
      setUser(null);
      navigate('/login');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      toast.success('Innlogget');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.error_description || error.message || 'Kunne ikke logge inn');
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      navigate('/login');
      toast.success('Logget ut');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Kunne ikke logge ut');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
