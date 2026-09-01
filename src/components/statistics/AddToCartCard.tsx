
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon, ShoppingCartIcon } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

interface AddToCartCardProps {
  addToCartCount: number;
  isLoading: boolean;
}

export const AddToCartCard = ({ addToCartCount, isLoading }: AddToCartCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Lagt til i handlekurv
        </CardTitle>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-2 max-w-xs">
                <p className="font-medium">Antall lagt til i handlekurv</p>
                <p>Det totale antallet produkter som er lagt til i handlekurven i den valgte tidsperioden.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader size="sm" text="Laster handlekurvdata..." />
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <ShoppingCartIcon className="h-5 w-5 text-[#E2B808]" />
            <div className="text-2xl font-bold">
              {addToCartCount?.toLocaleString('no') ?? 0}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
