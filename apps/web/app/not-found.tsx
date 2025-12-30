"use client";

import Link from "next/link";
import { Button } from "@form-builder/ui/components/button";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md animate-fade-in-up">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto">
          <FileQuestion className="w-12 h-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="text-2xl font-semibold">Página não encontrada</h2>
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => window.history.back()} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button className="gap-2" asChild>
            <Link href="/">
              <Home className="w-4 h-4" />
              Ir para início
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

