import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
  onRemoveImage?: () => void;
}

const ImageUpload = ({ onImageUploaded, currentImage, onRemoveImage }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
      
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      const file = event.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo de imagem.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    onImageUploaded(url);
      toast({
        title: "Sucesso",
      description: "Imagem enviada e salva no Supabase!",
    });
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(event.target.value);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    onImageUploaded(imageUrl);
      toast({
      title: "Sucesso",
      description: "URL de imagem adicionada!",
      });
  };

  const removeImage = () => {
    setImageUrl("");
    if (onRemoveImage) {
      onRemoveImage();
    }
  };

  return (
    <div className="space-y-2">
      <Label>Imagem do Item</Label>
      {currentImage ? (
        <div className="relative inline-block">
          <img
            src={currentImage}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-md border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
            onClick={removeImage}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
              onChange={handleFileChange}
            disabled={uploading}
            id="image-upload"
          />
            <span className="text-xs text-muted-foreground">ou</span>
            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <Input
                type="url"
                placeholder="Cole a URL da imagem"
                value={imageUrl}
                onChange={handleUrlChange}
                className="w-64"
              />
              <Button type="submit" variant="secondary" size="sm">
                Usar URL
              </Button>
            </form>
          </div>
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB. Você pode escolher um arquivo local ou colar uma URL de imagem.
          </p>
        </>
      )}
    </div>
  );
};

export default ImageUpload;
