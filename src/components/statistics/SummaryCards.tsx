
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagesSquare, UserRound } from "lucide-react";
import { Loader } from "@/components/ui/loader";

interface SummaryCardsProps {
  totalMessages: number;
  totalConversations: number;
  isLoading: boolean;
}

export const SummaryCards = ({ totalMessages, totalConversations, isLoading }: SummaryCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Antall meldinger
          </CardTitle>
          <MessagesSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader size="sm" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {totalMessages?.toLocaleString('no') ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Antall meldinger sendt
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Antall Brukere
          </CardTitle>
          <UserRound className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader size="sm" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {totalConversations?.toLocaleString('no') ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Totalt antall forskjellige brukere
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
