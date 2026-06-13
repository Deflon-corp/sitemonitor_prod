import React from "react";
import Login from "../components/login/Login";
const LoginPage = () => {
  return (
    <div className="main-wrapper auth-bg">
      <div className="container-fluid">
        <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
          <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap">
            <div className="col-lg-4 mx-auto">
              <Login />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
