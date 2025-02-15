
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
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Kunne ikke hente brukerprofil');
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      toast.error('En feil oppstod ved henting av brukerprofil');
      return null;
    }
  };

  const handleUserSession = async (userId: string, userEmail: string) => {
    try {
      const profile = await fetchUserProfile(userId);
      
      if (!profile) {
        toast.error('Kunne ikke finne brukerprofil');
        return null;
      }

      const userData = {
        id: userId,
        email: userEmail,
        role: profile.role,
        organization_id: profile.organization_id
      };

      setUser(userData);

      // Redirect based on role and organization
      if (profile.role === 'admin' && profile.organization_id === 'f8796b61-37a1-4727-8e4e-e6262a1a8185') {
        navigate('/admin');
      } else if (profile.organization_id) {
        navigate('/dashboard');
      } else {
        toast.error('Ingen organisasjon tilknyttet');
        return null;
      }

      return userData;
    } catch (error) {
      console.error('Error in handleUserSession:', error);
      toast.error('En feil oppstod ved håndtering av brukerøkt');
      return null;
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await handleUserSession(session.user.id, session.user.email!);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await handleUserSession(session.user.id, session.user.email!);
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
        const userData = await handleUserSession(data.user.id, data.user.email!);
        if (userData) {
          toast.success('Innlogget');
        }
      }
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
