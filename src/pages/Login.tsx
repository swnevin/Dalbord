import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { useMinimumLoading } from "@/hooks/use-minimum-loading";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const showLoader = useMinimumLoading(isLoading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
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
          {showLoader ? (
            <div className="py-8">
              <Loader size="lg" />
            </div>
          ) : (
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
                />
              </div>
              <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-primary">
                Logg inn
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
