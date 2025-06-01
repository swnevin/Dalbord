
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const Login = () => {
  const handleRedirect = () => {
    window.open('https://dashboard.dalboard.com', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center space-y-4 pb-4">
          <img 
            src="/lovable-uploads/83daf21e-b819-4f65-9aed-581fdf00778c.png" 
            alt="DALAI Logo" 
            className="h-40 mx-auto"
          />
          <CardTitle className="text-2xl text-primary font-bold">
            Denne plattformen er avviklet
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div className="text-center space-y-4">
            <p className="text-lg text-primary/80">
              Vi har flyttet til en ny og forbedret dashboard-løsning.
            </p>
            <p className="text-sm text-muted-foreground">
              For å fortsette å bruke DALAI-tjenestene, vennligst opprett en konto på vår nye plattform med den samme e-postadressen du har brukt her. Du kan selv velge passord.
            </p>
          </div>
          
          <Button 
            onClick={handleRedirect}
            className="w-full bg-dalai-yellow hover:bg-dalai-yellow/90 text-primary flex items-center gap-2"
            size="lg"
          >
            Gå til ny dashboard
            <ExternalLink size={16} />
          </Button>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              dashboard.dalboard.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
