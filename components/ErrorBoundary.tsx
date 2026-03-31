import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State;
  props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      
      try {
        const parsedError = JSON.parse(this.state.error?.message || '');
        if (parsedError.error === 'Missing or insufficient permissions.') {
          errorMessage = 'Você não tem permissão para realizar esta operação. Certifique-se de estar logado com uma conta autorizada.';
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-10 text-center">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase">Ops! Algo deu errado</h2>
            <p className="text-slate-600 mb-6 font-medium">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#E66B27] text-white font-black py-4 rounded-md uppercase tracking-widest"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
