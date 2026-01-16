import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function History() {
  const { data: history, isLoading } = trpc.whatsapp.getHistory.useQuery({
    limit: 100,
  });
  
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
    </div>
  );
}
