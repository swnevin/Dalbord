
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BugReport {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'resolved';
  created_at: string;
  organization: {
    name: string;
  };
  profile: {
    name: string;
  };
}

export const BugReportAdmin = () => {
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  
  const fetchBugReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select(`
          id,
          title,
          description,
          status,
          created_at,
          organization:organization_id(name),
          profile:user_id(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setBugReports(data || []);
    } catch (error) {
      console.error('Error fetching bug reports:', error);
      toast({
        title: "Feil ved lasting",
        description: "Kunne ikke laste feilrapporter",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBugReports();
  }, []);
  
  const handleReportClick = (report: BugReport) => {
    setSelectedReport(report);
    setOpenDetailDialog(true);
  };
  
  const handleStatusChange = async () => {
    if (!selectedReport) return;
    
    const newStatus = selectedReport.status === 'pending' ? 'resolved' : 'pending';
    
    try {
      const { error } = await supabase
        .from('bug_reports')
        .update({ status: newStatus })
        .eq('id', selectedReport.id);
      
      if (error) throw error;
      
      // Update local state
      setBugReports(prev => 
        prev.map(report => 
          report.id === selectedReport.id ? { ...report, status: newStatus } : report
        )
      );
      setSelectedReport({ ...selectedReport, status: newStatus });
      
      toast({
        title: "Status oppdatert",
        description: `Feilrapport markert som ${newStatus === 'resolved' ? 'løst' : 'under arbeid'}`,
      });
    } catch (error) {
      console.error('Error updating bug report status:', error);
      toast({
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere status",
        variant: "destructive",
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('no', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-montserrat text-primary">Feilrapporter</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-4">Laster feilrapporter...</p>
        ) : bugReports.length === 0 ? (
          <p className="text-center py-4">Ingen feilrapporter å vise</p>
        ) : (
          <div className="space-y-4">
            {bugReports.map((report) => (
              <Collapsible key={report.id} className="border rounded-md">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {report.status === 'resolved' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                    <div>
                      <h4 className="font-medium">{report.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {report.organization?.name} - {formatDate(report.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleReportClick(report)}
                    >
                      Detaljer
                    </Button>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm mb-2">
                      <span className="font-medium">Rapportert av:</span> {report.profile?.name || 'Ukjent bruker'}
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Status:</span> {report.status === 'resolved' ? 'Løst' : 'Under arbeid'}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{report.description}</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
      
      {selectedReport && (
        <Dialog open={openDetailDialog} onOpenChange={setOpenDetailDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedReport.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Organisasjon</h4>
                <p>{selectedReport.organization?.name || 'Ukjent'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Rapportert av</h4>
                <p>{selectedReport.profile?.name || 'Ukjent bruker'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Dato</h4>
                <p>{formatDate(selectedReport.created_at)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Status</h4>
                <p>{selectedReport.status === 'resolved' ? 'Løst' : 'Under arbeid'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Beskrivelse</h4>
                <p className="whitespace-pre-wrap">{selectedReport.description}</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant={selectedReport.status === 'resolved' ? 'outline' : 'default'}
                onClick={handleStatusChange}
              >
                {selectedReport.status === 'resolved' ? 'Merk som uløst' : 'Merk som løst'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};
