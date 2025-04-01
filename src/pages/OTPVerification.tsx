
import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";

const OTPVerification = () => {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract email from state passed during navigation
    const state = location.state as { email: string } | undefined;
    if (!state?.email) {
      // If no email in state, redirect to login
      navigate("/login");
      return;
    }
    setEmail(state.email);
    
    // Set up countdown timer
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [location.state, navigate]);

  const handleVerify = async () => {
    if (!email || otp.length !== 6) {
      toast.error("Ugyldig kode. Vennligst skriv inn den 6-sifrede koden.");
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        toast.success("Verifisering vellykket! Logger inn...");
        navigate("/dashboard");
      } else {
        throw new Error("Noe gikk galt ved verifisering.");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error(error.message || "Verifisering mislyktes. Vennligst prøv igjen.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (secondsLeft > 0) return;
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          channel: 'email', // Explicitly request OTP
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
      toast.success("Ny kode er sendt til din e-post!");
      setSecondsLeft(60);
      
      // Restart the countdown
      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error: any) {
      console.error("Error resending OTP:", error);
      toast.error(error.message || "Kunne ikke sende ny kode. Vennligst prøv igjen.");
    }
  };

  if (!email) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <img 
            src="/lovable-uploads/83daf21e-b819-4f65-9aed-581fdf00778c.png" 
            alt="DALAI Logo" 
            className="h-32 mx-auto"
          />
          <CardTitle className="text-xl text-primary/80">
            Tofaktorautentisering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-gray-600">
            En 6-sifret kode har blitt sendt til <strong>{email}</strong>.
            <br />Vennligst skriv inn koden for å fortsette.
          </p>
          
          <div className="flex justify-center">
            <InputOTP 
              maxLength={6}
              value={otp}
              onChange={setOtp}
              render={({ slots }) => (
                <InputOTPGroup>
                  {slots.map((slot, index) => (
                    <InputOTPSlot key={index} {...slot} index={index} />
                  ))}
                </InputOTPGroup>
              )}
            />
          </div>
          
          <Button 
            onClick={handleVerify} 
            disabled={otp.length !== 6 || isVerifying} 
            className="w-full bg-secondary hover:bg-secondary/90 text-primary"
          >
            {isVerifying ? <Loader size="sm" /> : "Verifiser"}
          </Button>
          
          <div className="text-center text-sm">
            <button 
              onClick={handleResendOTP}
              disabled={secondsLeft > 0}
              className="text-primary hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {secondsLeft > 0 ? 
                `Send ny kode (${secondsLeft}s)` : 
                "Send ny kode"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPVerification;
