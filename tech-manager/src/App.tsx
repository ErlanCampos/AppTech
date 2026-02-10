import { lazy, Suspense } from 'react';
import { useAppStore } from './store/useAppStore';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Technicians = lazy(() => import('./pages/Technicians').then(m => ({ default: m.Technicians })));
const Orders = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.Orders })));
const MyTasks = lazy(() => import('./pages/MyTasks').then(m => ({ default: m.MyTasks })));
const CalendarView = lazy(() => import('./pages/CalendarView').then(m => ({ default: m.CalendarView })));
const MapView = lazy(() => import('./pages/MapView').then(m => ({ default: m.MapView })));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-3 border-emerald-200 dark:border-stone-700 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin" />
  </div>
);

const FullScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-stone-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-stone-700 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-stone-400 text-sm animate-pulse">Carregando...</p>
    </div>
  </div>
);

function App() {
  const { isLoading } = useSupabaseAuth();
  const currentUser = useAppStore(state => state.currentUser);

  if (isLoading) {
    return <FullScreenLoader />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />

        <Route path="/" element={currentUser ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="technicians" element={<Suspense fallback={<PageLoader />}><Technicians /></Suspense>} />
          <Route path="orders" element={<Suspense fallback={<PageLoader />}><Orders /></Suspense>} />
          <Route path="my-tasks" element={<Suspense fallback={<PageLoader />}><MyTasks /></Suspense>} />
          <Route path="calendar" element={<Suspense fallback={<PageLoader />}><CalendarView /></Suspense>} />
          <Route path="map" element={<Suspense fallback={<PageLoader />}><MapView /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
