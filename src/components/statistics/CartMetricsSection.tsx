
import React from 'react';
import { Separator } from "@/components/ui/separator";
import { ShoppingCartIcon } from "lucide-react";
import { AddToCartChart } from "./AddToCartChart";

interface CartMetricsSectionProps {
  addToCartCount: number;
  addToCartTimeSeries: Array<{
    date: string;
    add_to_cart: number;
  }>;
  isLoading: boolean;
  isVisible: boolean;
}

export const CartMetricsSection: React.FC<CartMetricsSectionProps> = ({
  addToCartCount,
  addToCartTimeSeries,
  isLoading,
  isVisible
}) => {
  if (!isVisible) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <ShoppingCartIcon size={20} />
        <h2 className="text-xl font-semibold">Handlekurv-statistikk</h2>
      </div>
      <Separator className="bg-primary/10" />
      
      <div className="grid gap-4 grid-cols-1">
        <AddToCartChart
          timeSeries={addToCartTimeSeries}
          totalCount={addToCartCount}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
