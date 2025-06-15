import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, Minus, Edit2 } from "lucide-react";
import { BeverageItem } from "@/types/inventory";
import BeverageForm from "./BeverageForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ITEMS_PER_PAGE = 30;

const BeveragesInventory = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [beverages, setBeverages] = useState<BeverageItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BeverageItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState(0);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [categoryFilter, setCategoryFilter] = useState("");
  const [displayedItems, setDisplayedItems] = useState<BeverageItem[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Buscar bebidas do Supabase
  const fetchBeverages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bebidas")
      .select("id, nome, quantidade, ponto_reposicao, imagem_url, categoria");
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      const mappedBeverages = (data || []).map((item) => ({
        id: String(item.id),
        name: item.nome || "",
        currentQuantity: Number(item.quantidade) || 0,
        reorderPoint: Number(item.ponto_reposicao) || 0,
        image: item.imagem_url || "",
        category: item.categoria || "",
      }));
      setBeverages(mappedBeverages);
      setDisplayedItems(mappedBeverages.slice(0, ITEMS_PER_PAGE));
      setHasMore(mappedBeverages.length > ITEMS_PER_PAGE);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBeverages();
  }, []);

  // Função para carregar mais itens
  const loadMore = () => {
    const currentLength = displayedItems.length;
    const nextItems = beverages.slice(currentLength, currentLength + ITEMS_PER_PAGE);
    setDisplayedItems([...displayedItems, ...nextItems]);
    setHasMore(currentLength + ITEMS_PER_PAGE < beverages.length);
  };

  // Adicionar bebida
  const handleAddItem = async (item: Omit<BeverageItem, "id">) => {
    const { error } = await supabase.from("bebidas").insert({
      nome: item.name,
      quantidade: item.currentQuantity,
      ponto_reposicao: item.reorderPoint,
      imagem_url: item.image,
      categoria: item.category,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bebida adicionada", description: `${item.name} foi adicionada ao inventário.` });
      fetchBeverages();
      setIsFormOpen(false);
    }
  };

  // Editar bebida
  const handleEditItem = async (item: BeverageItem) => {
    const { error } = await supabase.from("bebidas").update({
      nome: item.name,
      quantidade: item.currentQuantity,
      ponto_reposicao: item.reorderPoint,
      imagem_url: item.image,
      categoria: item.category,
    }).eq("id", item.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bebida atualizada", description: `${item.name} foi atualizada com sucesso.` });
      fetchBeverages();
      setEditingItem(null);
    }
  };

  // Remover bebida
  const handleDeleteItem = async (id: string) => {
    const item = beverages.find(b => b.id === id);
    const { error } = await supabase.from("bebidas").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bebida removida", description: `${item?.name} foi removida do inventário.`, variant: "destructive" });
      fetchBeverages();
    }
  };

  const getStockStatus = (current: number, reorderPoint: number) => {
    if (current <= reorderPoint) {
      return <Badge variant="destructive">Baixo Estoque</Badge>;
    }
    return <Badge variant="default">Em Estoque</Badge>;
  };

  // Filtro de pesquisa e categoria
  const uniqueCategories = Array.from(new Set(beverages.map(m => m.category).filter(Boolean)));
  const filteredBeverages = beverages.filter((beverage) =>
    beverage.name.toLowerCase().includes(search.toLowerCase()) &&
    (categoryFilter === "" || beverage.category === categoryFilter)
  );

  // Atualizar displayedItems quando o filtro mudar
  useEffect(() => {
    setDisplayedItems(filteredBeverages.slice(0, ITEMS_PER_PAGE));
    setHasMore(filteredBeverages.length > ITEMS_PER_PAGE);
  }, [search, categoryFilter, beverages]);

  const handleAdjustQuantity = async (item: BeverageItem) => {
    if (!adjustValue || adjustValue <= 0) {
      toast({ title: "Erro", description: "Digite um valor válido.", variant: "destructive" });
      return;
    }
    const newQuantity = adjustType === 'add'
      ? item.currentQuantity + adjustValue
      : Math.max(0, item.currentQuantity - adjustValue);
    const { error } = await supabase.from("bebidas").update({ quantidade: newQuantity }).eq("id", item.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quantidade atualizada", description: `Novo valor: ${newQuantity}` });
      setAdjustingId(null);
      setAdjustValue(0);
      setAdjustType('add');
      fetchBeverages();
    }
  };

  // Função para exportar PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Inventário de Bebidas", 14, 16);
    
    // Ordenar todas as bebidas por nome
    const sortedBeverages = [...beverages].sort((a, b) => (
      (a.name || '').localeCompare(b.name || '')
    ));

    const tableData = sortedBeverages.map((item) => [
      item.name,
      item.category,
      item.currentQuantity,
      item.reorderPoint
    ]);

    autoTable(doc, {
      head: [["Nome", "Categoria", "Quantidade Atual", "Ponto de Reposição"]],
      body: tableData,
      startY: 22,
      rowPageBreak: 'avoid',
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 50 },
        3: { cellWidth: 40 },
      }
    });
    doc.save("inventario-bebidas.pdf");
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <h3 className="text-xl font-semibold">Bebidas do Restaurante</h3>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Pesquisar bebida..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">Todas as categorias</option>
            {uniqueCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Bebida
          </Button>
          <Button onClick={handleExportPDF} variant="secondary" className="flex items-center gap-2">
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagem</TableHead>
              <TableHead>Nome da Bebida</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Quantidade Atual</TableHead>
              <TableHead>Ponto de Reposição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Carregando bebidas...</TableCell>
              </TableRow>
            ) : displayedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Nenhuma bebida encontrada.</TableCell>
              </TableRow>
            ) : (
              displayedItems.map((beverage) => (
                <TableRow key={beverage.id}>
                  <TableCell>
                    {beverage.image && (
                      <img src={beverage.image} alt={beverage.name} className="w-12 h-12 object-cover rounded-md" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{beverage.name}</TableCell>
                  <TableCell>{beverage.category}</TableCell>
                  <TableCell>{beverage.currentQuantity}</TableCell>
                  <TableCell>{beverage.reorderPoint}</TableCell>
                  <TableCell>{getStockStatus(beverage.currentQuantity, beverage.reorderPoint)}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditingItem(beverage);
                      setIsFormOpen(true);
                    }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAdjustingId(beverage.id);
                        setAdjustValue(0);
                        setAdjustType('add');
                      }}
                    >
                      Ajustar Quantidade
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(beverage.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {adjustingId && (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAdjustType('subtract')}
                      className={adjustType === 'subtract' ? 'bg-red-100' : ''}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAdjustType('add')}
                      className={adjustType === 'add' ? 'bg-green-100' : ''}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      value={adjustValue}
                      onChange={(e) => setAdjustValue(parseInt(e.target.value) || 0)}
                      className="w-24 text-center"
                      placeholder="Valor"
                    />
                    <Button size="sm" onClick={() => handleAdjustQuantity(beverages.find(b => b.id === adjustingId)!)}>
                      Confirmar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAdjustingId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {hasMore && (
        <div className="text-center">
          <Button onClick={loadMore} disabled={loading}>
            {loading ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
      <BeverageForm
        isOpen={isFormOpen || !!editingItem}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleEditItem : handleAddItem}
        initialData={editingItem}
        title={editingItem ? "Editar Bebida" : "Adicionar Nova Bebida"}
      />
    </div>
  );
};

export default BeveragesInventory;