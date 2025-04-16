
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";

interface User {
  id: string;
  email: string;
  organization_id?: string;
}

interface PreviewUser {
  id: string;
  email: string;
  organization_id: string;
  tabs: string[];
}

interface AuthContextType {
  user: User | null;
  previewUser: PreviewUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  enterPreviewMode: (previewUser: PreviewUser) => void;
  exitPreviewMode: () => void;
  isInPreviewMode: boolean;
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
  const [previewUser, setPreviewUser] = useState<PreviewUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInPreviewMode, setIsInPreviewMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
        if (profile.organization_type === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
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
    // If in preview mode, exit it instead of logging out
    if (isInPreviewMode) {
      exitPreviewMode();
      return;
    }

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

  const enterPreviewMode = async (member: PreviewUser) => {
    try {
      setIsTransitioning(true);
      // Store original path to return to later
      sessionStorage.setItem('previewReturnPath', location.pathname);
      
      // Wait for a brief moment for the transition UI to appear
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setPreviewUser(member);
      setIsInPreviewMode(true);
      
      // Navigate to dashboard
      navigate('/dashboard');
      toast.success(`Forhåndsvisning startet for ${member.email}`);
    } catch (error) {
      console.error('Error entering preview mode:', error);
      toast.error('Kunne ikke starte forhåndsvisning');
    } finally {
      setIsTransitioning(false);
    }
  };

  const exitPreviewMode = async () => {
    try {
      setIsTransitioning(true);
      
      // Wait for a brief moment for the transition UI to appear
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setPreviewUser(null);
      setIsInPreviewMode(false);
      
      // Return to the original path
      const returnPath = sessionStorage.getItem('previewReturnPath') || '/admin';
      navigate(returnPath);
      sessionStorage.removeItem('previewReturnPath');
      
      toast.success('Forhåndsvisning avsluttet');
    } catch (error) {
      console.error('Error exiting preview mode:', error);
      toast.error('Kunne ikke avslutte forhåndsvisning');
    } finally {
      setIsTransitioning(false);
    }
  };

  if (isTransitioning) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <Loader 
          size="lg" 
          text={isInPreviewMode ? "Avslutter forhåndsvisning..." : "Laster inn klientforhåndsvisning..."}
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      previewUser, 
      login, 
      logout, 
      isLoading, 
      enterPreviewMode, 
      exitPreviewMode,
      isInPreviewMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};
