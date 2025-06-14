import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, Minus, Edit2, ChevronDown } from "lucide-react";
import { MaterialItem } from "@/types/inventory";
import MaterialForm from "./MaterialForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ITEMS_PER_PAGE = 30;

const MaterialsInventory = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [setorFilter, setSetorFilter] = useState("");
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState(0);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [displayedItems, setDisplayedItems] = useState<MaterialItem[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Função para ordenar materiais
  const sortMaterials = (materials: MaterialItem[]) => {
    return [...materials].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'setor':
          comparison = (a.setor || '').localeCompare(b.setor || '');
          if (comparison === 0) {
            comparison = (a.category || '').localeCompare(b.category || '');
            if (comparison === 0) {
              comparison = (a.name || '').localeCompare(b.name || '');
            }
          }
          break;
        case 'categoria':
          comparison = (a.category || '').localeCompare(b.category || '');
          if (comparison === 0) {
            comparison = (a.setor || '').localeCompare(b.setor || '');
            if (comparison === 0) {
              comparison = (a.name || '').localeCompare(b.name || '');
            }
          }
          break;
        case 'nome':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'quantidade':
          comparison = a.currentQuantity - b.currentQuantity;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Buscar materiais do Supabase
  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("materiais")
      .select("id, nome, quantidade, ponto_reposicao, imagem_url, categoria, setor");
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      const mappedMaterials = (data || []).map((item) => ({
          id: String(item.id),
          name: item.nome || "",
          currentQuantity: Number(item.quantidade) || 0,
          reorderPoint: Number(item.ponto_reposicao) || 0,
          image: item.imagem_url || "",
        category: item.categoria || "",
        setor: item.setor || ""
      }));
      setMaterials(mappedMaterials);
      setDisplayedItems(mappedMaterials.slice(0, ITEMS_PER_PAGE));
      setHasMore(mappedMaterials.length > ITEMS_PER_PAGE);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Função para carregar mais itens
  const loadMore = () => {
    const currentLength = displayedItems.length;
    const nextItems = materials.slice(currentLength, currentLength + ITEMS_PER_PAGE);
    setDisplayedItems([...displayedItems, ...nextItems]);
    setHasMore(currentLength + ITEMS_PER_PAGE < materials.length);
  };

  // Adicionar material
  const handleAddItem = async (item: Omit<MaterialItem, "id">) => {
    const { error } = await supabase.from("materiais").insert({
      nome: item.name,
      quantidade: item.currentQuantity,
      ponto_reposicao: item.reorderPoint,
      imagem_url: item.image,
      categoria: item.category,
      setor: item.setor
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
      categoria: item.category,
      setor: item.setor
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

  // Filtro de pesquisa e setor
  const uniqueSetores = Array.from(new Set(materials.map(m => m.setor).filter(Boolean)));
  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(search.toLowerCase()) &&
    (setorFilter === "" || material.setor === setorFilter)
  );

  // Atualizar displayedItems quando o filtro mudar
  useEffect(() => {
    setDisplayedItems(filteredMaterials.slice(0, ITEMS_PER_PAGE));
    setHasMore(filteredMaterials.length > ITEMS_PER_PAGE);
  }, [search, setorFilter, materials]);

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

  // Função para exportar PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Inventário de Materiais", 14, 16);
    
    // Ordenar todos os materiais por setor > categoria > nome
    const sortedMaterials = [...materials].sort((a, b) => {
      let comparison = (a.setor || '').localeCompare(b.setor || '');
      if (comparison === 0) {
        comparison = (a.category || '').localeCompare(b.category || '');
        if (comparison === 0) {
          comparison = (a.name || '').localeCompare(b.name || '');
        }
      }
      return comparison;
    });

    const tableData = sortedMaterials.map((item) => [
      item.image ? { content: '', image: item.image } : '',
      item.name,
      item.category,
      item.setor,
      item.currentQuantity
    ]);

   autoTable(doc, {
      head: [["Imagem", "Nome", "Categoria", "Setor", "Quantidade"]],
      body: tableData,
      startY: 22,
      rowPageBreak: 'avoid',
      didDrawCell: (data) => {
        if (data.column.index === 0 && data.cell.raw && data.cell.raw.image) {
          doc.addImage(
            data.cell.raw.image,
            "JPEG",
            data.cell.x + 2,
            data.cell.y + 2,
            25, // <--- AUMENTEI DE 18 PARA 25
            25  // <--- AUMENTEI DE 18 PARA 25
          );
        }
      },
      columnStyles: {
        0: { cellWidth: 28 }, // <--- AUMENTEI DE 22 PARA 28
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          data.cell.contentHeight = 28; // <--- AUMENTEI DE 22 PARA 28
        }
      },
    });
    doc.save("inventario-materiais.pdf");
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
            value={setorFilter}
            onChange={e => setSetorFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">Todos os setores</option>
            {uniqueSetores.map((setor) => (
              <option key={setor} value={setor}>{setor}</option>
            ))}
          </select>
          <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Material
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
              <TableHead>Nome do Item</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Quantidade Atual</TableHead>
              <TableHead>Ponto de Reposição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8}>Carregando...</TableCell></TableRow>
            ) : displayedItems.length === 0 ? (
              <TableRow><TableCell colSpan={8}>Nenhum item encontrado.</TableCell></TableRow>
            ) : displayedItems.map((material) => (
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
                <TableCell>{material.setor}</TableCell>
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

      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            onClick={loadMore}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronDown className="h-4 w-4" />
            Carregar mais itens
          </Button>
        </div>
      )}

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
