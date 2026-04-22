import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/NavBar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SubmitForm from './pages/SubmitForm.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import NewsletterPreview from './pages/NewsletterPreview.jsx';
import Archive from './pages/Archive.jsx';

export default function App() {
    const { user } = useAuth();

    return (
        <div className="d-flex flex-column min-vh-100">

            {/* Navbar */}
            {user && <Navbar />}

            {/* Main Content */}
            <main className="flex-grow-1">
                <Routes>
                    <Route
                        path="/login"
                        element={user ? <Navigate to="/" /> : <Login />}
                    />

                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/submit"
                        element={
                            <ProtectedRoute>
                                <SubmitForm />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute roles={['admin']}>
                                <AdminPanel />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/preview/:year/:month"
                        element={
                            <ProtectedRoute>
                                <NewsletterPreview />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/archive"
                        element={
                            <ProtectedRoute>
                                <Archive />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}