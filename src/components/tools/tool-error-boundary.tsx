import { Component, type ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { reportLovableError } from "@/lib/lovable-error-reporting";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Contém falhas de renderização de uma técnica/animação nesta área da tela,
 * em vez de derrubar a rota inteira. O usuário continua no app; só esta
 * ferramenta específica cai para uma mensagem simples.
 */
export class ToolErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown) {
    reportLovableError(error, { boundary: "tool_error_boundary" });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Não foi possível carregar a animação desta técnica agora. Siga os passos escritos acima
            — eles funcionam do mesmo jeito.
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}
