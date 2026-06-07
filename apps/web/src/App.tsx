import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FeedPage } from './pages/FeedPage';
import { LoginPage } from './pages/LoginPage';
import { ContentDetailPage } from './pages/ContentDetailPage';
import { CreatePage } from './pages/CreatePage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<FeedPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/content/:id" element={<ContentDetailPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
