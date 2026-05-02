import React from "react";

const ComingSoon = () => {
    return (
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
            <div className="text-center">

                {/* 🔄 Rotating Gear */}
                <i className="bi bi-gear-fill rotate-icon display-1 mb-3"></i>

                <h1 className="gradient-title mb-2 display-4">Coming Soon</h1>

                <p className="text-muted fw-bold small">
                    🚧 This feature is under development. Please check back soon.
                </p>
            </div>

            <style>{`
        .rotate-icon {
          color: #ee0979;
          display: inline-block;
          animation: spin 3s linear infinite !important;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .gradient-title {
          background: linear-gradient(45deg, #ff6a00, #ee0979);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
        }
      `}</style>
        </div>
    );
};

export default ComingSoon;