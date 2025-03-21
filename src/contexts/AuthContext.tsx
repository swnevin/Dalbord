import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
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
  const location = useLocation();

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          organization_id,
          organizations (
            type
          )
        `)
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Kunne ikke hente brukerprofil');
      }

      if (!profileData) {
        throw new Error('Ingen brukerprofil funnet');
      }

      return {
        organization_id: profileData.organization_id,
        organization_type: profileData.organizations?.type
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      throw error;
    }
  };

  const handleSession = async (session: any) => {
    if (!session?.user) {
      setUser(null);
      return;
    }

    try {
      const profile = await fetchUserProfile(session.user.id);
      
      const userData = {
        id: session.user.id,
        email: session.user.email,
        organization_id: profile.organization_id
      };

      setUser(userData);

      // Only handle navigation if we're not already on the admin dashboard
      // This prevents the flash when adding new members
      if (location.pathname !== '/admin') {
        // Allow both admin and client users to access admin pages
        navigate('/admin');
      }
      return true;
    } catch (error: any) {
      console.error('Error handling session:', error);
      setUser(null);
      throw error;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSession(session).catch((error) => {
          console.error('Session handling error:', error);
          navigate('/login');
        });
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        handleSession(session).catch((error) => {
          console.error('Auth state change error:', error);
          navigate('/login');
        });
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

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Ingen bruker returnert etter innlogging');
      }

      await handleSession(data.session);
      toast.success('Innlogget');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Kunne ikke logge inn');
      setUser(null);
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
