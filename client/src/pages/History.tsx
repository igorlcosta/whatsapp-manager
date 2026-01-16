import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function History() {
  const { data: history, isLoading, refetch } = trpc.whatsapp.getHistory.useQuery({
    limit: 100,
  });
  
  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  
  const deleteEntryMutation = trpc.whatsapp.deleteHistoryEntry.useMutation({
    onSuccess: () => {
      toast.success("Registro excluído com sucesso!");
      refetch();
      setDeleteEntryId(null);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
  
  const clearHistoryMutation = trpc.whatsapp.clearHistory.useMutation({
    onSuccess: () => {
      toast.success("Histórico limpo com sucesso!");
      refetch();
      setClearDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
  
  const handleDeleteEntry = (id: number) => {
    setDeleteEntryId(id);
  };
  
  const confirmDeleteEntry = () => {
    if (deleteEntryId) {
      deleteEntryMutation.mutate({ id: deleteEntryId });
    }
  };
  
  const confirmClearHistory = () => {
    clearHistoryMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Histórico de Uso</h1>
                <p className="text-muted-foreground mt-1">Registro completo de todas as atividades</p>
              </div>
            </div>
            {history && history.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={() => setClearDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Histórico
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="container py-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Registros de Uso</CardTitle>
            <CardDescription>
              {history?.length || 0} registros encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history && history.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Contatos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {new Date(record.usedAt).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell>{record.phoneNumber}</TableCell>
                        <TableCell>
                          {record.contactCount > 0 ? (
                            <Badge variant="default">{record.contactCount}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.wasBlocked === 1 ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              Bloqueado
                            </Badge>
                          ) : (
                            <Badge variant="default" className="flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              Usado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.notes || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEntry(record.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum registro encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Delete Entry Confirmation Dialog */}
      <AlertDialog open={deleteEntryId !== null} onOpenChange={(open) => !open && setDeleteEntryId(null)}>
        <AlertDialogContent className="bg-card text-card-foreground border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Excluir Registro
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Deseja realmente excluir este registro do histórico? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteEntry}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Clear History Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent className="bg-card text-card-foreground border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Limpar Todo o Histórico
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Deseja realmente limpar TODO o histórico? Todos os {history?.length || 0} registros serão excluídos permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmClearHistory}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
