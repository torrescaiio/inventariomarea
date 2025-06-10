
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
    expirationDate: "",
    image: ""
  });
  const [selectedDate, setSelectedDate] = useState<Date>();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        currentQuantity: initialData.currentQuantity,
        expirationDate: initialData.expirationDate,
        image: initialData.image || ""
      });
      setSelectedDate(new Date(initialData.expirationDate));
    } else {
      setFormData({
        name: "",
        currentQuantity: 0,
        expirationDate: "",
        image: ""
      });
      setSelectedDate(undefined);
    }
  }, [initialData, isOpen]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFormData({ ...formData, expirationDate: date.toISOString().split('T')[0] });
    }
  };

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Bebida</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Coca-Cola, Água, Suco..."
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
            <Label>Data de Validade</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <ImageUpload
            onImageUploaded={handleImageUploaded}
            currentImage={formData.image}
            onRemoveImage={handleRemoveImage}
          />

          <div className="flex justify-end gap-2">
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

export default BeverageForm;
