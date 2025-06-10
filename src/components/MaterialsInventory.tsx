import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, Minus, Edit2 } from "lucide-react";
import { MaterialItem } from "@/types/inventory";
import MaterialForm from "./MaterialForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MaterialsInventory = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState(0);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');

  // Buscar materiais do Supabase
  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("materiais")
      .select("id, nome, quantidade, ponto_reposicao, imagem_url, categoria");
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setMaterials(
        (data || []).map((item) => ({
          id: String(item.id),
          name: item.nome || "",
          currentQuantity: Number(item.quantidade) || 0,
          reorderPoint: Number(item.ponto_reposicao) || 0,
          image: item.imagem_url || "",
          category: item.categoria || ""
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Adicionar material
  const handleAddItem = async (item: Omit<MaterialItem, "id">) => {
    const { error } = await supabase.from("materiais").insert({
      nome: item.name,
      quantidade: item.currentQuantity,
      ponto_reposicao: item.reorderPoint,
      imagem_url: item.image,
      categoria: item.category
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item adicionado", description: `${item.name} foi adicionado ao inventário.` });
      fetchMaterials();
      setIsFormOpen(false);
    }
  };

  // Editar material
  const handleEditItem = async (item: MaterialItem) => {
    const { error } = await supabase.from("materiais").update({
      nome: item.name,
      quantidade: item.currentQuantity,
      ponto_reposicao: item.reorderPoint,
      imagem_url: item.image,
      categoria: item.category
    }).eq("id", item.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item atualizado", description: `${item.name} foi atualizado com sucesso.` });
      fetchMaterials();
      setEditingItem(null);
    }
  };

  // Remover material
  const handleDeleteItem = async (id: string) => {
    const item = materials.find(m => m.id === id);
    const { error } = await supabase.from("materiais").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item removido", description: `${item?.name} foi removido do inventário.`, variant: "destructive" });
      fetchMaterials();
    }
  };

  const getStockStatus = (current: number, reorderPoint: number) => {
    if (current <= reorderPoint) {
      return <Badge variant="destructive">Baixo Estoque</Badge>;
    }
    return <Badge variant="default">Em Estoque</Badge>;
  };

  // Filtro de pesquisa e categoria
  const uniqueCategories = Array.from(new Set(materials.map(m => m.category).filter(Boolean)));
  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(search.toLowerCase()) &&
    (categoryFilter === "" || material.category === categoryFilter)
  );

  const handleAdjustQuantity = async (item: MaterialItem) => {
    if (!adjustValue || adjustValue <= 0) {
      toast({ title: "Erro", description: "Digite um valor válido.", variant: "destructive" });
      return;
    }
    const newQuantity = adjustType === 'add'
      ? item.currentQuantity + adjustValue
      : Math.max(0, item.currentQuantity - adjustValue);
    const { error } = await supabase.from("materiais").update({ quantidade: newQuantity }).eq("id", item.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quantidade atualizada", description: `Novo valor: ${newQuantity}` });
      setAdjustingId(null);
      setAdjustValue(0);
      setAdjustType('add');
      fetchMaterials();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <h3 className="text-xl font-semibold">Materiais do Restaurante</h3>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Pesquisar item..."
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
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Material
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagem</TableHead>
              <TableHead>Nome do Item</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Quantidade Atual</TableHead>
              <TableHead>Ponto de Reposição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7}>Carregando...</TableCell></TableRow>
            ) : filteredMaterials.length === 0 ? (
              <TableRow><TableCell colSpan={7}>Nenhum item encontrado.</TableCell></TableRow>
            ) : filteredMaterials.map((material) => (
              <TableRow key={material.id}>
                <TableCell>
                  {material.image ? (
                    <img 
                      src={material.image} 
                      alt={material.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Sem foto</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{material.name}</TableCell>
                <TableCell>{material.category}</TableCell>
                <TableCell>{material.currentQuantity}</TableCell>
                <TableCell>{material.reorderPoint}</TableCell>
                <TableCell>{getStockStatus(material.currentQuantity, material.reorderPoint)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingItem(material)}
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={() => setAdjustingId(material.id)}
                    >
                      Ajustar Quantidade
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteItem(material.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  {adjustingId === material.id && (
                    <div className="mt-2 p-2 border rounded bg-muted flex flex-col gap-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min={1}
                          value={adjustValue}
                          onChange={e => setAdjustValue(Number(e.target.value))}
                          className="border rounded px-2 py-1 text-sm w-20"
                          placeholder="Qtd"
                        />
                        <select
                          value={adjustType}
                          onChange={e => setAdjustType(e.target.value as 'add' | 'subtract')}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="add">Adicionar</option>
                          <option value="subtract">Subtrair</option>
                        </select>
                        <Button size="sm" onClick={() => handleAdjustQuantity(material)}>
                          OK
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAdjustingId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MaterialForm
        isOpen={isFormOpen || !!editingItem}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleEditItem : handleAddItem}
        initialData={editingItem}
        title={editingItem ? "Editar Material" : "Adicionar Material"}
      />
    </div>
  );
};

export default MaterialsInventory;
