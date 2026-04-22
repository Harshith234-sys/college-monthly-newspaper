import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
            <div className="container">

                {/* Logo */}
                <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
                    <div
                        className="bg-warning text-dark fw-bold d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px', borderRadius: '6px' }}
                    >
                        VJ
                    </div>
                    <span className="fw-bold">VNRVJIET Newsletter</span>
                </Link>

                {/* Toggle (mobile) */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarContent"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Links */}
                <div className="collapse navbar-collapse" id="navbarContent">
                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0">

                        <li className="nav-item">
                            <Link className="nav-link" to="/">Dashboard</Link>
                        </li>

                        <li className="nav-item">
                            <Link className="nav-link" to="/submit">Submit</Link>
                        </li>

                        <li className="nav-item">
                            <Link className="nav-link" to="/archive">Archive</Link>
                        </li>

                        {user?.role === 'admin' && (
                            <li className="nav-item">
                                <Link className="nav-link" to="/admin">Admin</Link>
                            </li>
                        )}

                        {/* User + Logout */}
                        <li className="nav-item d-flex align-items-center ms-lg-3">
                            <span className="text-light me-2 small">
                                {user?.name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="btn btn-outline-light btn-sm"
                            >
                                Logout
                            </button>
                        </li>

                    </ul>
                </div>
            </div>
        </nav>
    );
}