
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export const ServerStatus = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-montserrat">Systemstatus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-green-600">
          <div className="relative flex items-center">
            <CheckCircle className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white animate-pulse"></span>
          </div>
          <span className="font-medium">Alle systemer er operative</span>
        </div>
      </CardContent>
    </Card>
  );
};
