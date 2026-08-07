
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { AddMovie } from './pages/AddMovie';
import { Movies } from './pages/Movies';
import { MovieDetail } from './pages/MovieDetail';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';
import { LanguageProvider } from './contexts/LanguageContext';
import { AppProvider, useApp } from './contexts/AppContext';

const AppContent = () => {
  const { currentPath } = useApp();

  const renderContent = () => {
    switch (currentPath) {
      case '/':
        return <Dashboard />;
      case '/add-movie':
        return <AddMovie />;
      case '/movies':
        return <Movies />;
      case '/movies/detail':
        return <MovieDetail />;
      case '/chat':
        return <Chat />;
      case '/settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </LanguageProvider>
  );
}
