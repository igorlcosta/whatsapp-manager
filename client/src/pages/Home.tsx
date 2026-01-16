import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Clock, Phone, Sparkles, AlertTriangle, Trash2, Plus, Ban, Unlock, ArrowRight, Zap } from "lucide-react";
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
  
  const utils = trpc.useUtils();
  
  const useNumberMutation = trpc.whatsapp.useNumber.useMutation({
    onSuccess: () => {
      toast.success("Número registrado com sucesso!");
      refetch();
      utils.whatsapp.getSuggestion.invalidate(); // Invalida sugestão
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
      utils.whatsapp.getSuggestion.invalidate(); // Invalida sugestão
      setBlockDialogOpen(false);
      setBlockHours(48);
      setBlockNotes("");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
  
  const unblockNumberMutation = trpc.whatsapp.unblockNumber.useMutation({
    onSuccess: () => {
      toast.success("Número desbloqueado com sucesso!");
      refetch();
      utils.whatsapp.getSuggestion.invalidate(); // Invalida sugestão
      setUnblockDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
  
  const deleteNumberMutation = trpc.whatsapp.deleteNumber.useMutation({
    onSuccess: () => {
      toast.success("Número excluído com sucesso!");
      refetch();
      utils.whatsapp.getSuggestion.invalidate(); // Invalida sugestão
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
  
  const addNumberMutation = trpc.whatsapp.addNumber.useMutation({
    onSuccess: () => {
      toast.success("Número adicionado com sucesso!");
      refetch();
      utils.whatsapp.getSuggestion.invalidate(); // Invalida sugestão
      setAddDialogOpen(false);
      setNewPhoneNumber("+55 ");
      setNewDisplayName("");
      setPhoneError("");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
  
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [contactCount, setContactCount] = useState(45);
  const [notes, setNotes] = useState("");
  const [blockHours, setBlockHours] = useState(48);
  const [blockNotes, setBlockNotes] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("+55 ");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [phoneError, setPhoneError] = useState("");
  
  const handleUseNumber = () => {
    if (selectedNumber === null) return;
    useNumberMutation.mutate({
      id: selectedNumber,
      contactCount,
      notes: notes || undefined,
    });
  };
  
  const handleBlockNumber = () => {
    if (selectedNumber === null) return;
    blockNumberMutation.mutate({
      id: selectedNumber,
      hours: blockHours,
      notes: blockNotes || undefined,
    });
  };
  
  const handleUnblockNumber = () => {
    if (selectedNumber === null) return;
    unblockNumberMutation.mutate({ id: selectedNumber });
  };
  
  const handleDeleteNumber = () => {
    if (selectedNumber === null) return;
    deleteNumberMutation.mutate({ id: selectedNumber });
  };
  
  const validatePhoneNumber = (phone: string): string => {
    if (!phone.trim()) {
      return "Digite um número de telefone";
    }
    
    // Verifica formato (apenas números, +, -, ( ), espaços)
    if (!/^\+?[0-9\s\-\(\)]+$/.test(phone)) {
      return "Use apenas números, +, -, ( ) e espaços";
    }
    
    // Conta dígitos
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      return "Número muito curto (mínimo 10 dígitos)";
    }
    if (digits.length > 15) {
      return "Número muito longo (máximo 15 dígitos)";
    }
    
    return "";
  };
  
  const formatPhoneNumber = (value: string): string => {
    // Remove tudo exceto dígitos
    let digits = value.replace(/\D/g, '');
    
    // Limita em 15 dígitos totais (55 + 11 dígitos)
    if (digits.length > 13) {
      digits = digits.slice(0, 13);
    }
    
    // Se estiver vazio, retorna +55
    if (digits.length === 0) {
      return '+55 ';
    }
    
    // Remove o 55 se já estiver presente (para não duplicar)
    const withoutCountryCode = digits.startsWith('55') ? digits.slice(2) : digits;
    
    // Formata: +55 (XX) XXXXX-XXXX ou +55 (XX) XXXX-XXXX
    let formatted = '+55 ';
    
    if (withoutCountryCode.length > 0) {
      formatted += '(';
      formatted += withoutCountryCode.slice(0, 2); // DDD
      
      if (withoutCountryCode.length > 2) {
        formatted += ') ';
        
        if (withoutCountryCode.length <= 6) {
          // Primeiros 4 dígitos
          formatted += withoutCountryCode.slice(2);
        } else {
          // Formato completo com hífen
          const isNineDigits = withoutCountryCode.length >= 10;
          if (isNineDigits) {
            // 9XXXX-XXXX
            formatted += withoutCountryCode.slice(2, 7);
            if (withoutCountryCode.length > 7) {
              formatted += '-' + withoutCountryCode.slice(7, 11);
            }
          } else {
            // XXXX-XXXX
            formatted += withoutCountryCode.slice(2, 6);
            if (withoutCountryCode.length > 6) {
              formatted += '-' + withoutCountryCode.slice(6, 10);
            }
          }
        }
      }
    }
    
    return formatted;
  };
  
  const handlePhoneChange = (value: string) => {
    // Se o usuário apagar tudo, mantém +55
    if (value.length === 0 || value === '+') {
      setNewPhoneNumber('+55 ');
      setPhoneError('');
      return;
    }
    
    // Aplica formatação
    const formatted = formatPhoneNumber(value);
    setNewPhoneNumber(formatted);
    
    // Valida
    const error = validatePhoneNumber(formatted);
    setPhoneError(error);
  };
  
  const handleAddNumber = () => {
    const error = validatePhoneNumber(newPhoneNumber);
    if (error) {
      setPhoneError(error);
      toast.error(error);
      return;
    }
    
    addNumberMutation.mutate({
      phoneNumber: newPhoneNumber.trim(),
      displayName: newDisplayName.trim() || undefined,
    });
  };
  
  const availableCount = numbers?.filter(n => n.calculatedStatus === "available").length || 0;
  const cooldownCount = numbers?.filter(n => n.calculatedStatus === "cooldown").length || 0;
  const blockedCount = numbers?.filter(n => n.calculatedStatus === "blocked").length || 0;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }
  
  // Empty state: Nenhum número cadastrado
  if (!numbers || numbers.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">WhatsApp Manager</h1>
                <p className="text-sm text-muted-foreground">Gerenciamento inteligente de números</p>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Phone className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Bem-vindo ao WhatsApp Manager</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Comece adicionando seus números de WhatsApp para gerenciar o rodízio de forma inteligente.
            </p>
            <Button size="lg" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Primeiro Número
            </Button>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-xl border border-border/40 bg-card/50">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">Sugestão Inteligente</h3>
                <p className="text-sm text-muted-foreground">
                  Sistema sugere automaticamente os melhores números para usar
                </p>
              </div>
              
              <div className="p-6 rounded-xl border border-border/40 bg-card/50">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="font-semibold mb-2">Cooldown Automático</h3>
                <p className="text-sm text-muted-foreground">
                  Controle de 24h entre usos para evitar bloqueios do WhatsApp
                </p>
              </div>
              
              <div className="p-6 rounded-xl border border-border/40 bg-card/50">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2">Histórico Completo</h3>
                <p className="text-sm text-muted-foreground">
                  Rastreie todos os usos e mantenha controle total
                </p>
              </div>
            </div>
          </div>
        </main>
        
        {/* Dialog: Adicionar Número */}
        <Dialog open={addDialogOpen} onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) {
            setPhoneError("");
            setNewPhoneNumber("+55 ");
            setNewDisplayName("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar novo número</DialogTitle>
              <DialogDescription>
                Insira as informações do número de WhatsApp
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPhoneNumber" className={phoneError ? "text-red-600 dark:text-red-400" : ""}>
                  Número de telefone *
                </Label>
                <Input
                  id="newPhoneNumber"
                  value={newPhoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+55 11 91234-5678"
                  maxLength={19}
                  className={phoneError ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {phoneError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {phoneError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Formato: +55 (XX) XXXXX-XXXX ou +55 XX XXXXX-XXXX
                </p>
              </div>
              <div>
                <Label htmlFor="newDisplayName">Nome de exibição (opcional)</Label>
                <Input
                  id="newDisplayName"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Ex: Número João"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddNumber} disabled={addNumberMutation.isPending}>
                {addNumberMutation.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">WhatsApp Manager</h1>
              <p className="text-sm text-muted-foreground">Gerenciamento inteligente de números</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/historico">
                <Clock className="w-4 h-4 mr-2" />
                Histórico
              </Link>
            </Button>
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Número
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold mt-1">{numbers?.length || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Disponíveis</p>
                  <p className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{availableCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Em Cooldown</p>
                  <p className="text-3xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">{cooldownCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Bloqueados</p>
                  <p className="text-3xl font-bold mt-1 text-red-600 dark:text-red-400">{blockedCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Hero Section - Sugestão Inteligente */}
        {suggestion && suggestion.length > 0 ? (
          <div className="mb-12 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl blur-3xl"></div>
            <Card className="relative border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
              <CardContent className="pt-8 pb-8 relative">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">Pronto para adicionar contatos?</h2>
                    <p className="text-muted-foreground">Use estes 2 números agora • 45 contatos cada</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestion.map((num, index) => (
                    <div 
                      key={num.id} 
                      className="group relative p-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/40 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <Badge variant="outline" className="text-primary border-primary/40 bg-primary/5">
                          #{index + 1}
                        </Badge>
                        {!num.lastUsedAt && (
                          <Badge variant="outline" className="text-green-600 border-green-500/40 bg-green-500/10">
                            Nunca usado
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-3xl font-bold tracking-tight mb-2">{num.phoneNumber}</p>
                        {num.lastUsedAt ? (
                          <p className="text-sm text-muted-foreground">
                            Último uso: {new Date(num.lastUsedAt).toLocaleString("pt-BR")}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Pronto para primeiro uso</p>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full group-hover:shadow-lg group-hover:shadow-primary/20 transition-all"
                        size="lg"
                        onClick={() => {
                          setSelectedNumber(num.id);
                          setUseDialogOpen(true);
                        }}
                      >
                        Usar Agora
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mb-12">
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">Nenhum número disponível no momento</h2>
                    <p className="text-muted-foreground mb-4">
                      Todos os números estão em cooldown ou bloqueados. Aguarde a liberação automática.
                    </p>
                    {numbers && numbers.length > 0 && (() => {
                      const nextAvailable = numbers
                        .filter(n => n.calculatedStatus === "cooldown")
                        .sort((a, b) => a.timeRemaining - b.timeRemaining)[0];
                      
                      if (nextAvailable) {
                        return (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                            <span className="text-muted-foreground">
                              Próximo disponível: <span className="font-semibold text-foreground">{nextAvailable.phoneNumber}</span> em{" "}
                              <span className="font-semibold text-foreground">{formatTimeRemaining(nextAvailable.timeRemaining)}</span>
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Numbers Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Todos os números</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {numbers?.sort((a, b) => {
              // Ordem de prioridade: available (0) > cooldown (1) > blocked (2)
              const statusOrder: Record<string, number> = { available: 0, cooldown: 1, blocked: 2 };
              const orderA = statusOrder[a.calculatedStatus] ?? 3;
              const orderB = statusOrder[b.calculatedStatus] ?? 3;
              
              if (orderA !== orderB) {
                return orderA - orderB;
              }
              
              // Se tiverem o mesmo status, ordena por tempo restante (menor primeiro)
              return a.timeRemaining - b.timeRemaining;
            }).map((number) => (
              <Card 
                key={number.id} 
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  number.calculatedStatus === "available" 
                    ? "border-green-500/20 hover:border-green-500/40 hover:shadow-green-500/10" 
                    : number.calculatedStatus === "cooldown"
                    ? "border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-yellow-500/10"
                    : "border-red-500/20 hover:border-red-500/40 hover:shadow-red-500/10"
                }`}
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  number.calculatedStatus === "available" 
                    ? "bg-gradient-to-br from-green-500/5 to-transparent" 
                    : number.calculatedStatus === "cooldown"
                    ? "bg-gradient-to-br from-yellow-500/5 to-transparent"
                    : "bg-gradient-to-br from-red-500/5 to-transparent"
                }`}></div>
                
                <CardContent className="pt-6 relative">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {number.calculatedStatus === "available" && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-xs font-medium">Disponível</span>
                        </div>
                      )}
                      {number.calculatedStatus === "cooldown" && (
                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs font-medium">{formatTimeRemaining(number.timeRemaining)}</span>
                        </div>
                      )}
                      {number.calculatedStatus === "blocked" && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-xs font-medium">Bloqueado</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedNumber(number.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Phone Number */}
                  <div className="mb-4">
                    <p className="text-2xl font-bold tracking-tight mb-1">{number.phoneNumber}</p>
                    {number.isSensitive && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Sensível
                      </Badge>
                    )}
                  </div>
                  
                  {/* Last Used Info */}
                  {number.lastUsedAt && (
                    <p className="text-xs text-muted-foreground/70 mb-4">
                      Último uso: {new Date(number.lastUsedAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {number.calculatedStatus === "available" && (
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          setSelectedNumber(number.id);
                          setUseDialogOpen(true);
                        }}
                      >
                        Usar Agora
                      </Button>
                    )}
                    
                    {number.calculatedStatus === "cooldown" && (
                      <Button 
                        className="flex-1"
                        variant="secondary"
                        disabled
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Em espera
                      </Button>
                    )}
                    
                    {number.calculatedStatus === "blocked" && (
                      <Button 
                        className="flex-1"
                        variant="outline"
                        onClick={() => {
                          setSelectedNumber(number.id);
                          setUnblockDialogOpen(true);
                        }}
                      >
                        <Unlock className="w-4 h-4 mr-2" />
                        Desbloquear
                      </Button>
                    )}
                    
                    {number.calculatedStatus === "available" && (
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedNumber(number.id);
                          setBlockDialogOpen(true);
                        }}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      
      {/* Dialog: Usar Número */}
      <Dialog open={useDialogOpen} onOpenChange={setUseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar uso do número</DialogTitle>
            <DialogDescription>
              Informe quantos contatos foram adicionados
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contactCount">Quantidade de contatos</Label>
              <Input
                id="contactCount"
                type="number"
                value={contactCount}
                onChange={(e) => setContactCount(parseInt(e.target.value) || 0)}
                placeholder="45"
              />
            </div>
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Adicionado ao meio-dia"
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
      
      {/* Dialog: Bloquear Número */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear número</DialogTitle>
            <DialogDescription>
              Marque este número como sensível e defina o tempo de bloqueio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="blockHours">Tempo de bloqueio (horas)</Label>
              <Input
                id="blockHours"
                type="number"
                value={blockHours}
                onChange={(e) => setBlockHours(parseInt(e.target.value) || 0)}
                placeholder="48"
              />
            </div>
            <div>
              <Label htmlFor="blockNotes">Motivo (opcional)</Label>
              <Textarea
                id="blockNotes"
                value={blockNotes}
                onChange={(e) => setBlockNotes(e.target.value)}
                placeholder="Ex: Recebeu aviso do WhatsApp"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBlockNumber} disabled={blockNumberMutation.isPending} variant="destructive">
              {blockNumberMutation.isPending ? "Bloqueando..." : "Bloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AlertDialog: Desbloquear */}
      <AlertDialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbloquear número?</AlertDialogTitle>
            <AlertDialogDescription>
              Este número voltará a ficar disponível imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblockNumber}>
              Desbloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* AlertDialog: Excluir */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir número?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O número será removido permanentemente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNumber} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialog: Adicionar Número */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar novo número</DialogTitle>
            <DialogDescription>
              Insira as informações do número de WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPhoneNumber">Número de telefone *</Label>
              <Input
                id="newPhoneNumber"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value)}
                placeholder="+55 11 91234-5678"
              />
            </div>
            <div>
              <Label htmlFor="newDisplayName">Nome de exibição (opcional)</Label>
              <Input
                id="newDisplayName"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Ex: Número João"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddNumber} disabled={addNumberMutation.isPending}>
              {addNumberMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
