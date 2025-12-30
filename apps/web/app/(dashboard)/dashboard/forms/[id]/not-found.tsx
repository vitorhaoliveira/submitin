import Link from "next/link";
import { Button } from "@form-builder/ui/components/button";
import { FileX, ArrowLeft } from "lucide-react";

export default function FormNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
          <FileX className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Formulário não encontrado</h1>
          <p className="text-muted-foreground">
            Este formulário pode ter sido excluído ou você não tem acesso a ele.
          </p>
        </div>
        <Link href="/dashboard/forms">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para formulários
          </Button>
        </Link>
      </div>
    </div>
  );
}

