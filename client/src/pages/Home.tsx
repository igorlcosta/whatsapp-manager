import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Clock, Phone, Sparkles, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

function formatTimeRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function Home() {
  const { data: numbers, isLoading, refetch } = trpc.whatsapp.listNumbers.useQuery(undefined, {
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
  
  const { data: suggestion } = trpc.whatsapp.getSuggestion.useQuery(undefined, {
    refetchInterval: 30000,
  });
  
  const useNumberMutation = trpc.whatsapp.useNumber.useMutation({
    onSuccess: () => {
      toast.success("Número registrado com sucesso!");
      refetch();
      setUseDialogOpen(false);
      setContactCount(45);
      setNotes("");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
  
  const blockNumberMutation = trpc.whatsapp.blockNumber.useMutation({
    onSuccess: () => {
      toast.success("Número bloqueado com sucesso!");
      refetch();
      setBlockDialogOpen(false);
      setBlockHours(48);
      setBlockNotes("");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
  
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [contactCount, setContactCount] = useState(45);
  const [notes, setNotes] = useState("");
  const [blockHours, setBlockHours] = useState(48);
  const [blockNotes, setBlockNotes] = useState("");
  
  const handleUseNumber = () => {
    if (selectedNumber) {
      useNumberMutation.mutate({
        id: selectedNumber,
        contactCount,
        notes: notes || undefined,
      });
    }
  };
  
  const handleBlockNumber = () => {
    if (selectedNumber) {
      blockNumberMutation.mutate({
        id: selectedNumber,
        hours: blockHours,
        notes: blockNotes || undefined,
      });
    }
  };
  
  const availableCount = numbers?.filter(n => n.calculatedStatus === "available").length || 0;
  const cooldownCount = numbers?.filter(n => n.calculatedStatus === "cooldown").length || 0;
  const blockedCount = numbers?.filter(n => n.calculatedStatus === "blocked").length || 0;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando números...</p>
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
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Phone className="w-8 h-8 text-primary" />
                WhatsApp Manager
              </h1>
              <p className="text-muted-foreground mt-1">Gerenciamento inteligente de números</p>
            </div>
            <Link href="/history">
              <Button variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                Histórico
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Números</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{numbers?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{availableCount}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Em Cooldown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{cooldownCount}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bloqueados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{blockedCount}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Suggestion Card */}
        {suggestion && suggestion.length > 0 && (
          <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Sparkles className="w-5 h-5" />
                Sugestão Inteligente
              </CardTitle>
              <CardDescription>
                {suggestion.length === 2 
                  ? "Use estes 2 números agora (45 contatos cada)" 
                  : "Use este número agora para melhor distribuição"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestion.map((num, index) => (
                  <div key={num.id} className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-primary/20">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-primary border-primary">
                          #{index + 1}
                        </Badge>
                        <p className="text-2xl font-bold text-foreground">{num.phoneNumber}</p>
                      </div>
                      {num.lastUsedAt ? (
                        <p className="text-sm text-muted-foreground mt-1">
                          Último uso: {new Date(num.lastUsedAt).toLocaleString("pt-BR")}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">Nunca usado</p>
                      )}
                    </div>
                    <Button 
                      size="lg"
                      onClick={() => {
                        setSelectedNumber(num.id);
                        setUseDialogOpen(true);
                      }}
                    >
                      Usar Agora
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Numbers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {numbers?.map((number) => (
            <Card 
              key={number.id} 
              className={`bg-card border-border transition-all hover:shadow-lg ${
                number.calculatedStatus === "available" 
                  ? "border-l-4 border-l-green-500" 
                  : number.calculatedStatus === "cooldown"
                  ? "border-l-4 border-l-yellow-500"
                  : "border-l-4 border-l-red-500"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {number.phoneNumber}
                    </CardTitle>
                    {number.isSensitive && (
                      <Badge variant="destructive" className="mt-2">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Sensível
                      </Badge>
                    )}
                  </div>
                  {number.calculatedStatus === "available" && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {number.calculatedStatus === "cooldown" && (
                    <Clock className="w-5 h-5 text-yellow-500" />
                  )}
                  {number.calculatedStatus === "blocked" && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Badge 
                      variant={
                        number.calculatedStatus === "available" 
                          ? "default" 
                          : number.calculatedStatus === "cooldown"
                          ? "secondary"
                          : "destructive"
                      }
                      className="mb-2"
                    >
                      {number.calculatedStatus === "available" && "Disponível"}
                      {number.calculatedStatus === "cooldown" && "Em Espera"}
                      {number.calculatedStatus === "blocked" && "Bloqueado"}
                    </Badge>
                    
                    {number.timeRemaining > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Libera em: <span className="font-semibold text-foreground">{formatTimeRemaining(number.timeRemaining)}</span>
                      </p>
                    )}
                  </div>
                  
                  {number.lastUsedAt && (
                    <div className="text-xs text-muted-foreground">
                      <p>Último uso: {new Date(number.lastUsedAt).toLocaleString("pt-BR")}</p>
                      <p>Contatos: {number.lastContactCount}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="default"
                      className="flex-1"
                      disabled={number.calculatedStatus !== "available"}
                      onClick={() => {
                        setSelectedNumber(number.id);
                        setUseDialogOpen(true);
                      }}
                    >
                      Usar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        setSelectedNumber(number.id);
                        setBlockDialogOpen(true);
                      }}
                    >
                      Bloquear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      
      {/* Use Number Dialog */}
      <Dialog open={useDialogOpen} onOpenChange={setUseDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Registrar Uso do Número</DialogTitle>
            <DialogDescription>
              Informe quantos contatos foram adicionados e observações opcionais.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="contactCount">Quantidade de Contatos</Label>
              <Input
                id="contactCount"
                type="number"
                value={contactCount}
                onChange={(e) => setContactCount(Number(e.target.value))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Adicionados ao meio-dia"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUseNumber} disabled={useNumberMutation.isPending}>
              {useNumberMutation.isPending ? "Registrando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Block Number Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Bloquear Número Manualmente</DialogTitle>
            <DialogDescription>
              Use quando receber aviso do WhatsApp ou precisar pausar o número.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="blockHours">Tempo de Bloqueio (horas)</Label>
              <Input
                id="blockHours"
                type="number"
                value={blockHours}
                onChange={(e) => setBlockHours(Number(e.target.value))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="blockNotes">Motivo do Bloqueio</Label>
              <Textarea
                id="blockNotes"
                value={blockNotes}
                onChange={(e) => setBlockNotes(e.target.value)}
                placeholder="Ex: Recebeu aviso do WhatsApp"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBlockNumber}
              disabled={blockNumberMutation.isPending}
            >
              {blockNumberMutation.isPending ? "Bloqueando..." : "Bloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
