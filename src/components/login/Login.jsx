import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { showToast } from '../common/alerts/ToastAlert'

const Login = () => {
  const [formData, setFormData] = useState({
    login_id: '',
    password: '',
  });

  const { login, sendOtp, verifyOtp, loading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('password');
  const [showPassword, setShowPassword] = useState(false);

  // ✅ OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);

  // Get expiry time from env (e.g., "60S" -> 60)
  const expiryTimeStr = import.meta.env.VITE_OTP_EXPIRY_TIME || "60S";
  const expirySeconds = parseInt(expiryTimeStr) || 60;

  const otpRefs = useRef([]);

  // Timer Effect
  useEffect(() => {
    let interval;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpSent && timer === 0) {
      setOtpExpired(true);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Handle Form Submit (Enter key or button click)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === 'password') {
      if (!formData.login_id) {
        showToast("Please enter your Login ID", "error");
        return;
      }
      if (!formData.password) {
        showToast("Please enter your Password", "error");
        return;
      }

      const result = await login(formData);

      if (result.meta.requestStatus === 'fulfilled') {
        showToast("Login successful", 'success');
        navigate('/home');
      }
    } else {
      // OTP logic triggered via Enter key
      if (!otpSent) {
        handleSendOtp();
      } else {
        handleVerifyOtp();
      }
    }
  };

  // ✅ Send OTP
  const handleSendOtp = async () => {
    if (!formData.login_id) {
      showToast("Please enter your Login ID to receive OTP", "error");
      return;
    }

    const result = await sendOtp(formData.login_id);

    if (result.meta.requestStatus === 'fulfilled') {
      setOtpSent(true);
      setTimer(expirySeconds);
      setOtpExpired(false);
      showToast(result.payload.message || "OTP sent successfully", "success");

      // focus first box
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  // ✅ Handle OTP input change
  const handleOtpChange = (element, index) => {
    const value = element.value.replace(/[^0-9]/g, "");
    let newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // move next
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  // ✅ Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  // ✅ Verify OTP
  const handleVerifyOtp = async () => {
    const finalOtp = otp.join("");

    if (finalOtp.length < 6) {
      showToast("Please enter the complete 6-digit OTP", "error");
      return;
    }

    const result = await verifyOtp(formData.login_id, finalOtp);

    if (result.meta.requestStatus === 'fulfilled') {
      showToast(result.payload.message || "Login successful", "success");
      navigate('/home');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="d-flex justify-content-center align-items-center"
    >
      <div className="d-flex flex-column justify-content-lg-center p-4 p-lg-0 pb-0 flex-fill">
        <div className="card border-0 p-lg-3 shadow-lg">
          <div className="card-body">
            {/* Logo */}
            <div className="mx-auto mb-2 text-center">
              <img
                src="/assets/images/4.png"
                alt="Logo"
                width={50}
                height={50}
                className="img-fluid"
              />
            </div>

            {/* Heading */}
            <div className="text-center mb-3">
              <h5 className="mb-2">Sign in to Sitemonitor</h5>
              <p className="mb-0">
                Please enter below details to access the dashboard
              </p>
            </div>

            {/* Tabs */}
            <div className="d-flex mb-3 border-bottom">
              <button
                type="button"
                className={`btn w-50 ${activeTab === 'password' ? 'btn-primary' : 'btn-light'}`}
                onClick={() => {
                  setActiveTab('password');
                  setOtpSent(false);
                }}
              >
                Login Id
              </button>

              <button
                type="button"
                className={`btn w-50 ${activeTab === 'otp' ? 'btn-primary' : 'btn-light'}`}
                onClick={() => setActiveTab('otp')}
              >
                Login with OTP
              </button>
            </div>

            {/* PASSWORD LOGIN */}
            {activeTab === 'password' && (
              <>
                <div className="mb-3">
                  <label className="form-label">Login Id</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white  border-end-0">
                      <i className="isax isax-sms-notification"></i>
                    </span>
                    <input
                      type="text"
                      name="login_id"
                      value={formData.login_id}
                      onChange={handleChange}
                      placeholder="Login ID / Email / Phone No."
                      className="form-control border-start-0 ps-0"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <div className="pass-group input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="isax isax-lock"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="****************"
                      className="pass-inputs form-control border-start-0 ps-0"
                    />
                    <span
                      className="input-group-text border-start-0 cursor-pointer"
                      onClick={togglePasswordVisibility}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className={`isax ${showPassword ? 'isax-eye-slash' : 'isax-eye'}`}></i>
                    </span>
                  </div></div>

                <button className="btn bg-primary-gradient text-white w-100">
                  {loading ? "Signing..." : "Sign In"}
                </button>
              </>
            )}

            {/* OTP LOGIN */}
            {activeTab === 'otp' && (
              <>
                <div className="mb-3">
                  <label className="form-label">Login Id</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-1">
                      <i className="isax isax-sms-notification"></i>
                    </span>
                    <input
                      type="text"
                      name="login_id"
                      value={formData.login_id}
                      onChange={handleChange}
                      readOnly={otpSent}
                      placeholder="Login ID / Email / Phone No."
                      className="form-control border-start-0 ps-0"
                    />
                  </div>
                </div>

                {/* OTP BOXES */}
                {otpSent && !otpExpired && (
                  <div className="mb-3">
                    <label className="d-block form-label mb-3">Enter OTP</label>
                    <div className="d-flex justify-content-center gap-2">
                      {otp.map((data, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength="1"
                          className="form-control text-center"
                          style={{ width: "45px", height: "45px", fontSize: "18px" }}
                          value={data}
                          ref={(el) => (otpRefs.current[index] = el)}
                          onChange={(e) => handleOtpChange(e.target, index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                        />
                      ))}
                    </div>
                    <div className="text-center mt-3">
                      <p className="text-muted mb-0">Resend OTP in <span className="text-primary fw-bold">{timer}s</span></p>
                    </div>
                  </div>
                )}

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="btn bg-primary-gradient text-white w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : "Send OTP"}
                  </button>
                ) : otpExpired ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="btn bg-primary-gradient text-white w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Resending...
                      </>
                    ) : "Resend OTP"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="btn bg-success text-white w-100"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                  </button>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </form>
  );
};

export default Login;