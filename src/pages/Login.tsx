
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Step 1: Verify password
      const { error: passwordError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (passwordError) throw passwordError;
      
      // Step 2: Sign out the user without eliminating the session
      await supabase.auth.signOut({ scope: 'local' });
      
      // Step 3: Send the OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          // Explicitly request OTP instead of magic link
          channel: 'email',
          emailRedirectTo: window.location.origin
        }
      });
      
      if (otpError) throw otpError;
      
      // Redirect to OTP verification page
      toast.success("Bekreftelseskode sendt til din e-post");
      navigate("/verify", { state: { email } });
      
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || "Pålogging mislyktes. Vennligst prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <img 
            src="/lovable-uploads/83daf21e-b819-4f65-9aed-581fdf00778c.png" 
            alt="DALAI Logo" 
            className="h-56 mx-auto"
          />
          <CardTitle className="text-xl text-primary/80">
            Logg inn for å se statistikk og samtaler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-primary">
                E-post
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                placeholder="Din e-postadresse"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-primary">
                Passord
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
                placeholder="Ditt passord"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-secondary hover:bg-secondary/90 text-primary"
              disabled={isLoading}
            >
              {isLoading ? <Loader size="sm" /> : "Logg inn"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
