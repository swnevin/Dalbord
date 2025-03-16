
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { SavingsSettings } from "./types";

interface SavingsSettingsProps {
  settings: SavingsSettings;
  onSettingsChange: (settings: SavingsSettings) => void;
}

export const SavingsSettingsDialog = ({
  settings,
  onSettingsChange,
}: SavingsSettingsProps) => {
  const [timePerMessage, setTimePerMessage] = useState(settings.timePerMessage.toString());
  const [hourlyRate, setHourlyRate] = useState(settings.hourlyRate.toString());
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSettingsChange({
      timePerMessage: parseFloat(timePerMessage) || 5,
      hourlyRate: parseFloat(hourlyRate) || 300,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings size={16} />
          <span>Juster beregningsinnstillinger</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Beregningsinnstillinger</DialogTitle>
          <DialogDescription>
            Juster verdiene som brukes til å beregne tid og penger spart
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="timePerMessage">Tid per melding (minutter)</Label>
            <Input
              id="timePerMessage"
              type="number"
              min="0.1"
              step="0.1"
              value={timePerMessage}
              onChange={(e) => setTimePerMessage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Gjennomsnittlig tid brukt på å svare på en melding manuelt
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hourlyRate">Timelønn (kr)</Label>
            <Input
              id="hourlyRate"
              type="number"
              min="1"
              step="1"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Gjennomsnittlig timelønn for ansatte som ville ha svart på meldinger
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Lagre endringer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
