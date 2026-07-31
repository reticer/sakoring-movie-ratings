import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { AddMovie } from './pages/AddMovie';
import { Movies } from './pages/Movies';
import { MovieDetail } from './pages/MovieDetail';
import { People } from './pages/People';
import { ImportExport } from './pages/ImportExport';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-movie" element={<AddMovie />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/people" element={<People />} />
          <Route path="/import-export" element={<ImportExport />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}
