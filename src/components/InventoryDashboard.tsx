
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MaterialsInventory from "./MaterialsInventory";
import BeveragesInventory from "./BeveragesInventory";

const InventoryDashboard = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Dashboard de Inventário</h1>
        <p className="text-lg text-muted-foreground">Gerencie o inventário do seu restaurante</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Controle de Estoque</CardTitle>
          <CardDescription>
            Monitore e gerencie materiais e bebidas do restaurante
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
    </div>
  );
};

export default InventoryDashboard;
