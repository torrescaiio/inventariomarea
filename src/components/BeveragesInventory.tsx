
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash } from "lucide-react";
import { BeverageItem } from "@/types/inventory";
import BeverageForm from "./BeverageForm";
import { useToast } from "@/hooks/use-toast";
import { format, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const BeveragesInventory = () => {
  const { toast } = useToast();
  const [beverages, setBeverages] = useState<BeverageItem[]>([
    {
      id: "1",
      name: "Coca-Cola",
      currentQuantity: 24,
      expirationDate: "2024-12-15",
      image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=100&h=100&fit=crop"
    },
    {
      id: "2",
      name: "Água Mineral",
      currentQuantity: 50,
      expirationDate: "2025-06-20",
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=100&h=100&fit=crop"
    },
    {
      id: "3",
      name: "Suco de Laranja",
      currentQuantity: 12,
      expirationDate: "2024-06-15",
      image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=100&h=100&fit=crop"
    }
  ]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BeverageItem | null>(null);

  const handleAddItem = (item: Omit<BeverageItem, "id">) => {
    const newItem: BeverageItem = {
      ...item,
      id: Date.now().toString()
    };
    setBeverages([...beverages, newItem]);
    setIsFormOpen(false);
    toast({
      title: "Bebida adicionada",
      description: `${item.name} foi adicionada ao inventário.`,
    });
  };

  const handleEditItem = (item: BeverageItem) => {
    setBeverages(beverages.map(b => b.id === item.id ? item : b));
    setEditingItem(null);
    toast({
      title: "Bebida atualizada",
      description: `${item.name} foi atualizada com sucesso.`,
    });
  };

  const handleDeleteItem = (id: string) => {
    const item = beverages.find(b => b.id === id);
    setBeverages(beverages.filter(b => b.id !== id));
    toast({
      title: "Bebida removida",
      description: `${item?.name} foi removida do inventário.`,
      variant: "destructive",
    });
  };

  const getExpirationStatus = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const warningDate = addDays(today, 30);

    if (isBefore(expDate, today)) {
      return <Badge variant="destructive">Vencida</Badge>;
    } else if (isBefore(expDate, warningDate)) {
      return <Badge variant="secondary">Vence em breve</Badge>;
    }
    return <Badge variant="default">Válida</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Bebidas do Restaurante</h3>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Bebida
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagem</TableHead>
              <TableHead>Nome da Bebida</TableHead>
              <TableHead>Quantidade Atual</TableHead>
              <TableHead>Data de Validade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {beverages.map((beverage) => (
              <TableRow key={beverage.id}>
                <TableCell>
                  {beverage.image ? (
                    <img 
                      src={beverage.image} 
                      alt={beverage.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Sem foto</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{beverage.name}</TableCell>
                <TableCell>{beverage.currentQuantity}</TableCell>
                <TableCell>
                  {format(new Date(beverage.expirationDate), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>{getExpirationStatus(beverage.expirationDate)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingItem(beverage)}
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteItem(beverage.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BeverageForm
        isOpen={isFormOpen || !!editingItem}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleEditItem : handleAddItem}
        initialData={editingItem}
        title={editingItem ? "Editar Bebida" : "Adicionar Bebida"}
      />
    </div>
  );
};

export default BeveragesInventory;
