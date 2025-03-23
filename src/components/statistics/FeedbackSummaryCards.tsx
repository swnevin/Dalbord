
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThumbsUp, Meh, ThumbsDown, UserRound } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FeedbackSummaryCardsProps {
  happyFaceCount: number;
  neutralFaceCount: number;
  sadFaceCount: number;
  escalatedCount: number;
  isLoading: boolean;
}

export const FeedbackSummaryCards: React.FC<FeedbackSummaryCardsProps> = ({
  happyFaceCount,
  neutralFaceCount,
  sadFaceCount,
  escalatedCount,
  isLoading
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fornøyde brukere</CardTitle>
          <ThumbsUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">{happyFaceCount}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Fornøyde tilbakemeldinger
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nøytrale brukere</CardTitle>
          <Meh className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">{neutralFaceCount}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Nøytrale tilbakemeldinger
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Misfornøyde brukere</CardTitle>
          <ThumbsDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">{sadFaceCount}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Negative tilbakemeldinger
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eskalerte samtaler</CardTitle>
          <UserRound className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">{escalatedCount}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Samtaler eskalert til menneske
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
