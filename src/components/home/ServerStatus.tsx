
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
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Alle systemer er operative</span>
        </div>
      </CardContent>
    </Card>
  );
};
