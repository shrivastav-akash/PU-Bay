import { Component } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Keeps one crashing section from blanking the whole page.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Alert variant="destructive" className="my-6">
        <TriangleAlert />
        <AlertTitle>This section failed to load</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          Something went wrong while rendering it. The rest of the page still works.
          <Button size="sm" variant="outline" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
}
