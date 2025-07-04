import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MaterialsInventory from "./MaterialsInventory";
import BeveragesInventory from "./BeveragesInventory";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const InventoryDashboard = () => {
  const { signOut } = useAuth();

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-screen flex flex-col">
      <div className="text-center space-y-2 relative">
        <h1 className="text-4xl font-bold text-foreground">Inventário Marea</h1>
        <p className="text-lg text-muted-foreground">Sistema de Gestão de Inventário</p>
        <Button 
          onClick={signOut} 
          variant="outline" 
          className="absolute top-0 right-0 px-4 py-2 text-base"
        >
          Sair
        </Button>
      </div>

      <Card className="w-full flex-grow">
        <CardHeader>
          <CardTitle className="text-2xl">Gestão de Inventário</CardTitle>
          <CardDescription>
            Controle de materiais e bebidas do restaurante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="materials" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="materials" className="text-lg py-3">
                Inventário de Materiais
              </TabsTrigger>
              <TabsTrigger value="beverages" className="text-lg py-3">
                Inventário de Bebidas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="materials" className="mt-6">
              <MaterialsInventory />
            </TabsContent>
            
            <TabsContent value="beverages" className="mt-6">
              <BeveragesInventory />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <footer className="text-center py-4 text-sm text-muted-foreground border-t">
        <p>Desenvolvido com ❤️ por Caio Torres</p>
        <p className="text-xs mt-1">© {new Date().getFullYear()} Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default InventoryDashboard;
