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
        category: item.category || "",
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
  const handleAddItem = async (item: Omit<MaterialItem, \"id\">) => {
    const { error } = await supabase.from(\"materiais\").insert({
      nome: item.name,
      quantidade: item.currentQuantity,
      ponto_reposicao: item.reorderPoint,
      imagem_url: item.image,
      categoria: item.category,
      setor: item.setor
    });
    if (error) {
      toast({ title: \"Erro\", description: error.message, variant: \"destructive\" });
    } else {
      toast({ title: \"Item adicionado\", description: `${item.name} foi adicionado ao inventário.` });
      fetchMaterials();
      setIsFormOpen(false);
    }
  };

  // Editar material
  const handleEditItem = async (item: MaterialItem) => {
    const { error } = await supabase.from(\"materiais\").update({
      nome: item.name,
      quantidade: item.currentQuantity,
      ponto_reposicao: item.reorderPoint,
      imagem_url: item.image,
      categoria: item.category,
      setor: item.setor
    }).eq(\"id\", item.id);
    if (error) {
      toast({ title: \"Erro\", description: error.message, variant: \"destructive\" });
    } else {
      toast({ title: \"Item atualizado\", description: `${item.name} foi atualizado com sucesso.` });
      fetchMaterials();
      setEditingItem(null);
    }
  };

  // Remover material
  const handleDeleteItem = async (id: string) => {
    const item = materials.find(m => m.id === id);
    const { error } = await supabase.from(\"materiais\").delete().eq(\"id\", id);
    if (error) {
      toast({ title: \"Erro\", description: error.message, variant: \"destructive\" });
    } else {
      toast({ title: \"Item removido\", description: `${item?.name} foi removido do inventário.`, variant: \"destructive\" });
      fetchMaterials();
    }
  };

  const getStockStatus = (current: number, reorderPoint: number) => {
    if (current <= reorderPoint) {
      return <Badge variant=\"destructive\">Baixo Estoque</Badge>;
    }\n    return <Badge variant=\"default\">Em Estoque</Badge>;
  };

  // Filtro de pesquisa e setor
  const uniqueSetores = Array.from(new Set(materials.map(m => m.setor).filter(Boolean)));
  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(search.toLowerCase()) &&
    (setorFilter === \"\" || material.setor === setorFilter)
  );\n\n  // Atualizar displayedItems quando o filtro mudar
  useEffect(() => {\n    setDisplayedItems(filteredMaterials.slice(0, ITEMS_PER_PAGE));\n    setHasMore(filteredMaterials.length > ITEMS_PER_PAGE);\n  }, [search, setorFilter, materials]);\n\n  const handleAdjustQuantity = async (item: MaterialItem) => {\n    if (!adjustValue || adjustValue <= 0) {\n      toast({ title: \"Erro\", description: \"Digite um valor válido.\", variant: \"destructive\" });\n      return;\n    }\n    const newQuantity = adjustType === 'add'\n      ? item.currentQuantity + adjustValue\n      : Math.max(0, item.currentQuantity - adjustValue);\n    const { error } = await supabase.from(\"materiais\").update({ quantidade: newQuantity }).eq(\"id\", item.id);\n    if (error) {\n      toast({ title: \"Erro\", description: error.message, variant: \"destructive\" });\n    } else {\n      toast({ title: \"Quantidade atualizada\", description: `Novo valor: ${newQuantity}` });\n      setAdjustingId(null);\n      setAdjustValue(0);\n      setAdjustType('add');\n      fetchMaterials();\n    }\n  };\n\n  // Função para exportar PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(\"Inventário de Materiais\", 14, 16);\n    \n    // Ordenar todos os materiais por setor > categoria > nome
    const sortedMaterials = [...materials].sort((a, b) => {
      let comparison = (a.setor || '').localeCompare(b.setor || '');
      if (comparison === 0) {
        comparison = (a.category || '').localeCompare(b.category || '');
        if (comparison === 0) {
          comparison = (a.name || '').localeCompare(b.name || '');
        }\n      }\n      return comparison;\n    });\n\n    const tableData = sortedMaterials.map((item) => [\n      item.image ? { content: '', image: item.image } : '',
      item.name,\n      item.category,\n      item.setor,\n      item.currentQuantity
    ]);\n\n   autoTable(doc, {\n      head: [[\"Imagem\", \"Nome\", \"Categoria\", \"Setor\", \"Quantidade\"]],\n      body: tableData,\n      startY: 22,\n      rowPageBreak: 'avoid',\n      didDrawCell: (data) => {
        if (data.column.index === 0 && data.cell.raw && data.cell.raw.image) {
          doc.addImage(
            data.cell.raw.image,
            \"JPEG\",
            data.cell.x + 2,
            data.cell.y + 2,
            40, // VALOR CORRIGIDO PARA 40
            40  // VALOR CORRIGIDO PARA 40
          );\n        }\n      },\n      columnStyles: {\n        0: { cellWidth: 50 }, // VALOR CORRIGIDO PARA 50
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
      },\n      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          data.cell.contentHeight = 60; // VALOR CORRIGIDO PARA 60
        }\n      },\n    });\n    doc.save(\"inventario-materiais.pdf\");
  };\n  return (\n    <div className=\"space-y-4\">\n      <div className=\"flex flex-col md:flex-row md:justify-between md:items-center gap-2\">\n        <h3 className=\"text-xl font-semibold\">Materiais do Restaurante</h3>\n        <div className=\"flex gap-2 items-center\">\n          <input\n            type=\"text\"\n            placeholder=\"Pesquisar item...\"\n            value={search}\n            onChange={e => setSearch(e.target.value)}\n            className=\"border rounded px-2 py-1 text-sm\"\n          />\n          <select\n            value={setorFilter}\n            onChange={e => setSetorFilter(e.target.value)}\n            className=\"border rounded px-2 py-1 text-sm\"\n          >\n            <option value=\"\">Todos os setores</option>\n            {uniqueSetores.map((setor) => (\n              <option key={setor} value={setor}>{setor}</option>\n            ))}\n          </select>\n          <Button onClick={() => setIsFormOpen(true)} className=\"flex items-center gap-2\">\n            <Plus className=\"h-4 w-4\" />\n            Adicionar Material\n          </Button>\n          <Button onClick={handleExportPDF} variant=\"secondary\" className=\"flex items-center gap-2\">\n            Exportar PDF\n          </Button>\n        </div>\n      </div>\n\n      <div className=\"border rounded-lg\">\n        <Table>\n          <TableHeader>\n            <TableRow>\n              <TableHead>Imagem</TableHead>\n              <TableHead>Nome do Item</TableHead>\n              <TableHead>Categoria</TableHead>\n              <TableHead>Setor</TableHead>\n              <TableHead>Quantidade Atual</TableHead>\n              <TableHead>Ponto de Reposição</TableHead>\n              <TableHead>Status</TableHead>\n              <TableHead>Ações</TableHead>\n            </TableRow>\n          </TableHeader>\n          <TableBody>\n            {loading ? (\n              <TableRow><TableCell colSpan={8}>Carregando...</TableCell></TableRow>\n            ) : displayedItems.length === 0 ? (\n              <TableRow><TableCell colSpan={8}>Nenhum item encontrado.</TableCell></TableRow>\n            ) : displayedItems.map((material) => (\n              <TableRow key={material.id}>\n                <TableCell>\n                  {material.image ? (\n                    <img \n                      src={material.image} \n                      alt={material.name}\n                      className=\"w-12 h-12 object-cover rounded-md\"\n                    />\n                  ) : (\n                    <div className=\"w-12 h-12 bg-muted rounded-md flex items-center justify-center\">\n                      <span className=\"text-xs text-muted-foreground\">Sem foto</span>\n                    </div>\n                  )}\n                </TableCell>\n                <TableCell className=\"font-medium\">{material.name}</TableCell>\n                <TableCell>{material.category}</TableCell>\n                <TableCell>{material.setor}</TableCell>\n                <TableCell>{material.currentQuantity}</TableCell>\n                <TableCell>{material.reorderPoint}</TableCell>\n                <TableCell>{getStockStatus(material.currentQuantity, material.reorderPoint)}</TableCell>\n                <TableCell>\n                  <div className=\"flex gap-2\">\n                    <Button \n                      variant=\"outline\" \n                      size=\"sm\"\n                      onClick={() => setEditingItem(material)}\n                    >\n                      Editar\n                    </Button>\n                    <Button \n                      variant=\"secondary\"\n                      size=\"sm\"\n                      onClick={() => setAdjustingId(material.id)}\n                    >\n                      Ajustar Quantidade\n                    </Button>\n                    <Button \n                      variant=\"destructive\" \n                      size=\"sm\"\n                      onClick={() => handleDeleteItem(material.id)}\n                    >\n                      <Trash className=\"h-4 w-4\" />\n                    </Button>\n                  </div>\n                  {adjustingId === material.id && (\n                    <div className=\"mt-2 p-2 border rounded bg-muted flex flex-col gap-2\">\n                      <div className=\"flex gap-2 items-center\">\n                        <input\n                          type=\"number\"\n                          min={1}\n                          value={adjustValue}\n                          onChange={e => setAdjustValue(Number(e.target.value))}\n                          className=\"border rounded px-2 py-1 text-sm w-20\"\n                          placeholder=\"Qtd\"\n                        />\n                        <select\n                          value={adjustType}\n                          onChange={e => setAdjustType(e.target.value as 'add' | 'subtract')}\n                          className=\"border rounded px-2 py-1 text-sm\"\n                        >\n                          <option value=\"add\">Adicionar</option>\n                          <option value=\"subtract\">Subtrair</option>\n                        </select>\n                        <Button size=\"sm\" onClick={() => handleAdjustQuantity(material)}>\n                          OK\n                        </Button>\n                        <Button size=\"sm\" variant=\"ghost\" onClick={() => setAdjustingId(null)}>\n                          Cancelar\n                        </Button>\n                      </div>\n                    </div>\n                  )}\n                </TableCell>\n              </TableRow>\n            ))}\n          </TableBody>\n        </Table>\n      </div>\n\n      {hasMore && (\n        <div className=\"flex justify-center py-4\">\n          <Button\n            onClick={loadMore}\n            variant=\"outline\"\n            className=\"flex items-center gap-2\"\n          >\n            <ChevronDown className=\"h-4 w-4\" />\n            Carregar mais itens\n          </Button>\n        </div>\n      )}\n\n      <MaterialForm\n        isOpen={isFormOpen || !!editingItem}\n        onClose={() => {\n          setIsFormOpen(false);\n          setEditingItem(null);\n        }}\n        onSubmit={editingItem ? handleEditItem : handleAddItem}\n        initialData={editingItem}\n        title={editingItem ? \"Editar Material\" : \"Adicionar Material\"}\n      />\n    </div>\n  );\n};\n\nexport default MaterialsInventory;\n```