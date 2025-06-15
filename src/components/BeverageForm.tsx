import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BeverageItem } from "@/types/inventory";
import ImageUpload from "./ImageUpload";

interface BeverageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: BeverageItem | Omit<BeverageItem, "id">) => void;
  initialData?: BeverageItem | null;
  title: string;
}

const BeverageForm = ({ isOpen, onClose, onSubmit, initialData, title }: BeverageFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    currentQuantity: 0,
    reorderPoint: 0,
    image: "",
    category: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        currentQuantity: initialData.currentQuantity,
        reorderPoint: initialData.reorderPoint,
        image: initialData.image || "",
        category: initialData.category || "",
      });
    } else {
      setFormData({
        name: "",
        currentQuantity: 0,
        reorderPoint: 0,
        image: "",
        category: "",
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
      <DialogContent className="sm:max-w-[600px] w-full bg-white rounded-xl shadow-2xl border-2 border-gray-100 space-y-8 p-10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Bebida</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Coca-cola, Suco de Laranja, Água..."
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
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
            <div className="flex-1 space-y-2">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ex: Cervejas, Refrigerantes, Sucos..."
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

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="px-6 py-2 text-base">
              Cancelar
            </Button>
            <Button type="submit" className="px-6 py-2 text-base font-semibold">
              {initialData ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BeverageForm;
