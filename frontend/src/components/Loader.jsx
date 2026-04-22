export default function Loader({ text = 'Loading...' }) {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">

            {/* Spinner */}
            <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>

            {/* Text */}
            <p className="text-muted small mb-0">{text}</p>
        </div>
    );
}