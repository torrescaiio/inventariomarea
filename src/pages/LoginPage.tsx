import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let error = null;

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      error = signUpError;
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      error = signInError;
    }

    if (error) {
      toast({ title: "Erro de Autenticação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: isSignUp ? "Cadastro realizado com sucesso! Verifique seu e-mail para confirmar." : "Login realizado com sucesso!", variant: "default" });
      // Redirecionamento será tratado pelo AuthContext
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold">
          {isSignUp ? "Cadastre-se" : "Entrar"}
        </h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Carregando..." : isSignUp ? "Cadastrar" : "Entrar"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
          <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="p-0 text-blue-600">
            {isSignUp ? "Entrar" : "Cadastre-se"}
          </Button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;