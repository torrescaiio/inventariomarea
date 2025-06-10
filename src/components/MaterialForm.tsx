import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialItem } from "@/types/inventory";
import ImageUpload from "./ImageUpload";

interface MaterialFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: MaterialItem | Omit<MaterialItem, "id">) => void;
  initialData?: MaterialItem | null;
  title: string;
}

const MaterialForm = ({ isOpen, onClose, onSubmit, initialData, title }: MaterialFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    currentQuantity: 0,
    reorderPoint: 0,
    image: "",
    category: ""
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        currentQuantity: initialData.currentQuantity,
        reorderPoint: initialData.reorderPoint,
        image: initialData.image || "",
        category: initialData.category || ""
      });
    } else {
      setFormData({
        name: "",
        currentQuantity: 0,
        reorderPoint: 0,
        image: "",
        category: ""
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (initialData) {
      onSubmit({
        ...initialData,
        ...formData
      });
    } else {
      onSubmit(formData);
    }
    
    onClose();
  };

  const handleImageUploaded = (url: string) => {
    setFormData({ ...formData, image: url });
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: "" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] space-y-6 p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Item</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Garfos, Facas, Pratos..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentQuantity">Quantidade Atual</Label>
            <Input
              id="currentQuantity"
              type="number"
              min="0"
              value={formData.currentQuantity}
              onChange={(e) => setFormData({ ...formData, currentQuantity: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reorderPoint">Ponto de Reposição</Label>
            <Input
              id="reorderPoint"
              type="number"
              min="0"
              value={formData.reorderPoint}
              onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ex: Talheres, Pratos, Estofados, Eletrônicos..."
              required
            />
          </div>

          <div className="space-y-3 pt-2 pb-1">
            <ImageUpload
              onImageUploaded={handleImageUploaded}
              currentImage={formData.image}
              onRemoveImage={handleRemoveImage}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {initialData ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialForm;
