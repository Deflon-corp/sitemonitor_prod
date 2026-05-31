import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { getDomainsApi } from "../../api/domainApi";
import { getUserByIdApi, updateUserApi } from "../../api/userApi";
import { showToast } from "../common/alerts/ToastAlert";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_UPPERCASE = /[A-Z]/;
const PASSWORD_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

function validatePhone(value) {
    if (!value || !value.trim()) return "Phone is required.";
    if (!/^\d+$/.test(value)) return "Phone must contain only numbers.";
    return "";
}

function validateEmail(value) {
    if (!value || !value.trim()) return "Email address is required.";
    if (!EMAIL_REGEX.test(value.trim())) return "Please enter a valid email address.";
    return "";
}

function validatePassword(value) {
    if (!value) return "Password is required.";
    if (value.length < PASSWORD_MIN_LENGTH) return "Password must be at least 8 characters.";
    if (!PASSWORD_UPPERCASE.test(value)) return "Password must contain at least one uppercase letter.";
    if (!PASSWORD_SPECIAL.test(value)) return "Password must contain at least one special symbol.";
    return "";
}

function validateConfirmPassword(value, passwordValue) {
    if (!value) return "Confirm password is required.";
    if (value !== passwordValue) return "Passwords do not match.";
    return "";
}

const UpdateProfile = ({ isEditMode = true }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});

    const [isAccountAdmin, setIsAccountAdmin] = useState(false);
    const [enableExportEmailNotification, setEnableExportEmailNotification] = useState(false);
    const [sendWelcomeMail, setSendWelcomeMail] = useState(true);
    const [language, setLanguage] = useState("en");

    const [openDetails, setOpenDetails] = useState(true);
    const [openDomains, setOpenDomains] = useState(true);
    const [openPermissions, setOpenPermissions] = useState(true);

    const [domains, setDomains] = useState([]);


    // Permissions
    const [allModules, setAllModules] = useState(true);
    const [visiblePolicies, setVisiblePolicies] = useState(true);
    const [visibleQualityAssurance, setVisibleQualityAssurance] = useState(true);
    const [visibleAccessibility, setVisibleAccessibility] = useState(true);
    const [visibleSeo, setVisibleSeo] = useState(true);
    const [visibleHeartbeat, setVisibleHeartbeat] = useState(true);
    const [visibleInventory, setVisibleInventory] = useState(true);
    const [visibleStatistics, setVisibleStatistics] = useState(true);
    const [visiblePrioritizedContent, setVisiblePrioritizedContent] = useState(true);
    const [visiblePerformance, setVisiblePerformance] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                // 1. Fetch available domains
                const domainsRes = await getDomainsApi(1, 100);
                let apiDomains = [];
                if (domainsRes.success && domainsRes.data?.domains) {
                    apiDomains = domainsRes.data.domains.map((d) => ({
                        id: String(d.dm_id || d._id),
                        name: d.dm_title,
                        url: d.dm_url,
                        visible: false,
                        sendReport: false,
                    }));
                }

                // 2. Fetch current logged-in user profile details
                const loggedInUserStr = localStorage.getItem("user");
                if (loggedInUserStr) {
                    const parsedUser = JSON.parse(loggedInUserStr);
                    const userId = parsedUser._id || parsedUser.id;
                    if (userId) {
                        const userRes = await getUserByIdApi(userId);
                        if (userRes.success && userRes.data) {
                            const u = userRes.data;
                            setFirstName(u.user_first_name || "");
                            setLastName(u.user_last_name || "");
                            setEmail(u.user_email || "");
                            setPhone(u.user_phone || "");
                            setLanguage(u.user_language || "en");
                            setIsAccountAdmin(!!u.user_is_account_admin);
                            setEnableExportEmailNotification(!!u.user_enable_export_notification);
                            setSendWelcomeMail(!!u.user_send_welcome_mail);
                            setAllModules(!!u.user_all_modules_access);
                            setVisiblePolicies(!!u.user_visible_policies);
                            setVisibleQualityAssurance(!!u.user_visible_qa);
                            setVisibleAccessibility(!!u.user_visible_accessibility);
                            setVisibleSeo(!!u.user_visible_seo);
                            setVisibleHeartbeat(!!u.user_visible_heartbeat);
                            setVisibleInventory(!!u.user_visible_inventory);
                            setVisibleStatistics(!!u.user_visible_statistics);
                            setVisiblePrioritizedContent(!!u.user_visible_prioritized_content);
                            setVisiblePerformance(!!u.user_visible_performance);

                            // 3. Merge user's domain settings
                            if (u.user_domains) {
                                apiDomains = apiDomains.map((ad) => {
                                    const ud = u.user_domains.find((d) => String(d.dm_id) === ad.id);
                                    return ud
                                        ? { ...ad, visible: !!ud.visible, sendReport: !!ud.send_report }
                                        : ad;
                                });
                            }
                        }
                    }
                }
                setDomains(apiDomains);
            } catch (error) {
                console.error("Failed to load user profile details dynamically:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [isEditMode]);

    const setPhoneValue = (value) => {
        const digitsOnly = value.replace(/\D/g, "");
        setPhone(digitsOnly);
    };

    const validateAll = () => {
        const firstErr = !firstName.trim() ? "First name is required." : "";
        const phoneErr = validatePhone(phone);
        const emailErr = validateEmail(email);
        const passwordErr = isEditMode && !password && !confirmPassword ? "" : validatePassword(password);
        const confirmErr = isEditMode && !password && !confirmPassword
            ? ""
            : validateConfirmPassword(confirmPassword, password);

        const newErrors = {
            firstName: firstErr || undefined,
            phone: phoneErr || undefined,
            email: emailErr || undefined,
            password: passwordErr || undefined,
            confirmPassword: confirmErr || undefined,
        };

        setErrors(newErrors);
        return !firstErr && !phoneErr && !emailErr && !passwordErr && !confirmErr;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!validateAll()) {
            console.error("Validation failed:", errors);
            return;
        }

        const userData = {
            user_first_name: firstName,
            user_last_name: lastName,
            user_phone: phone,
            user_email: email,
            user_language: language,
            user_is_account_admin: isAccountAdmin,
            user_enable_export_notification: enableExportEmailNotification,
            user_send_welcome_mail: sendWelcomeMail,
            user_status: "active",
            user_login_id: email,
            user_all_modules_access: allModules,
            user_visible_policies: visiblePolicies,
            user_visible_qa: visibleQualityAssurance,
            user_visible_accessibility: visibleAccessibility,
            user_visible_seo: visibleSeo,
            user_visible_heartbeat: visibleHeartbeat,
            user_visible_inventory: visibleInventory,
            user_visible_statistics: visibleStatistics,
            user_visible_prioritized_content: visiblePrioritizedContent,
            user_visible_performance: visiblePerformance,
            user_domains: domains.map((d) => ({
                dm_id: d.id,
                visible: d.visible,
                send_report: d.sendReport,
            })),
        };

        if (password) {
            userData.user_password = password;
        }

        try {
            setLoading(true);
            const loggedInUserStr = localStorage.getItem("user");
            if (loggedInUserStr) {
                const parsedUser = JSON.parse(loggedInUserStr);
                const userId = parsedUser._id || parsedUser.id;
                if (userId) {
                    const response = await updateUserApi(userId, userData);
                    if (response.success) {
                        const updatedUser = {
                            ...parsedUser,
                            user_first_name: firstName,
                            user_last_name: lastName,
                            user_email: email,
                            user_phone: phone,
                        };
                        localStorage.setItem("user", JSON.stringify(updatedUser));
                        showToast(response.message || "Profile updated successfully", "success");
                        navigate("/home/users");
                    } else {
                        showToast(response.message || "Failed to update profile", "error");
                    }
                }
            }
        } catch (error) {
            console.error("Error updating user profile:", error);
            showToast("Failed to update profile", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content add-domain-content">
            {/* Header */}
            <div className="add-domain-header mb-4 d-flex align-items-start justify-content-between gap-3">
                <div>
                    <h1 className="add-domain-title mb-1">
                        {isEditMode ? "Edit my profile" : "Add New User"}
                    </h1>
                    <p className="add-domain-subtitle text-muted mb-0">
                        {isEditMode
                            ? "Update your profile details below."
                            : "Enter the details for the new user you'd like to add"}
                    </p>
                </div>

                <Link
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 flex-shrink-0"
                    to="/home/users"
                >
                    <i className="isax isax-arrow-left-1"></i> Back
                </Link>
            </div>

            <div className="row g-4">
                {/* Left Column - User Information */}
                <div className="col-lg-6">
                    <div className="card add-domain-card border-0 shadow-sm mb-4">
                        <div className="card-header add-domain-card-header bg-white border-0 py-3 px-4 d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                                <i className="isax isax-profile-2user text-primary"></i>
                                <h5 className="mb-0 fw-semibold">User information</h5>
                            </div>
                            <button
                                className="btn btn-link btn-sm p-0 text-muted"
                                type="button"
                                onClick={() => setOpenDetails((v) => !v)}
                                aria-expanded={openDetails}
                            >
                                <i className={`isax ${openDetails ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}></i>
                            </button>
                        </div>

                        {openDetails && (
                            <div id="user-details">
                                <div className="card-body pt-0 px-4 pb-4">
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                First name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                                                placeholder="First name"
                                                value={firstName}
                                                onChange={(e) => {
                                                    setFirstName(e.target.value);
                                                    if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                                                }}
                                                onBlur={() => setErrors((prev) => ({ ...prev, firstName: !firstName.trim() ? "First name is required." : undefined }))}
                                            />
                                            {errors.firstName && <div className="invalid-feedback d-block">{errors.firstName}</div>}
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Last name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Last name"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Phone <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                                                placeholder="Phone (numbers only)"
                                                value={phone}
                                                onChange={(e) => {
                                                    setPhoneValue(e.target.value);
                                                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                                                }}
                                                onBlur={() => setErrors((prev) => ({ ...prev, phone: validatePhone(phone) || undefined }))}
                                            />
                                            {errors.phone && <div className="invalid-feedback d-block">{errors.phone}</div>}
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Email address <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                                                placeholder="Email address"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                                                }}
                                                onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(email) || undefined }))}
                                            />
                                            {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Password {isEditMode ? null : <span className="text-danger">*</span>}
                                            </label>
                                            <input
                                                type="password"
                                                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                                                placeholder={isEditMode ? "Leave blank to keep current" : "Min 8 chars, 1 uppercase, 1 special"}
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                                                    if (errors.confirmPassword) {
                                                        setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, e.target.value) || undefined }));
                                                    }
                                                }}
                                                onBlur={() => setErrors((prev) => ({ ...prev, password: (isEditMode && !password && !confirmPassword) ? undefined : validatePassword(password) || undefined }))}
                                            />
                                            {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Confirm password {isEditMode ? null : <span className="text-danger">*</span>}
                                            </label>
                                            <input
                                                type="password"
                                                className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                                                placeholder={"Confirm password"}
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    if (errors.confirmPassword) {
                                                        setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(e.target.value, password) || undefined }));
                                                    }
                                                }}
                                                onBlur={() => setErrors((prev) => ({ ...prev, confirmPassword: (isEditMode && !password && !confirmPassword) ? undefined : validateConfirmPassword(confirmPassword, password) || undefined }))}
                                            />
                                            {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Permissions */}
                <div className="col-lg-6">
                    {/* Permissions Section */}
                    <div className="card add-domain-card border-0 shadow-sm mb-4">
                        <div className="card-header add-domain-card-header bg-white border-0 py-3 px-4 d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                                <i className="isax isax-setting-2 text-primary"></i>
                                <h5 className="mb-0 fw-semibold">Permissions</h5>
                            </div>
                            <button
                                className="btn btn-link btn-sm p-0 text-muted"
                                type="button"
                                onClick={() => setOpenPermissions((v) => !v)}
                                aria-expanded={openPermissions}
                            >
                                <i className={`isax ${openPermissions ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}></i>
                            </button>
                        </div>

                        {openPermissions && (
                            <div id="permissions-notes">
                                <div className="card-body pt-0 px-4 pb-4">
                                    <div className="add-user-permission-section">
                                        <div className="row g-0">
                                            <div className="col-6">
                                                <div className="form-check form-switch mb-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="allModules"
                                                        checked={allModules}
                                                        onChange={(e) => {
                                                            const v = e.target.checked;
                                                            setAllModules(v);
                                                            setVisiblePolicies(v);
                                                            setVisibleQualityAssurance(v);
                                                            setVisibleAccessibility(v);
                                                            setVisibleSeo(v);
                                                            setVisibleHeartbeat(v);
                                                            setVisibleInventory(v);
                                                            setVisibleStatistics(v);
                                                            setVisiblePrioritizedContent(v);
                                                            setVisiblePerformance(v);
                                                        }}
                                                    />
                                                    <label className="form-check-label" htmlFor="allModules">All modules</label>
                                                </div>

                                                {[
                                                    { id: "visibleQualityAssurance", label: "Quality Assurance", state: visibleQualityAssurance, setter: setVisibleQualityAssurance },
                                                    { id: "visibleSeo", label: "SEO", state: visibleSeo, setter: setVisibleSeo },
                                                    { id: "visibleHeartbeat", label: "Heartbeat", state: visibleHeartbeat, setter: setVisibleHeartbeat },
                                                    { id: "visibleStatistics", label: "Statistics", state: visibleStatistics, setter: setVisibleStatistics },
                                                ].map(({ id, label, state, setter }) => (
                                                    <div key={id} className="form-check form-switch mb-2">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={id}
                                                            checked={state}
                                                            onChange={(e) => setter(e.target.checked)}
                                                        />
                                                        <label className="form-check-label" htmlFor={id}>{label}</label>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="col-6 border-start">
                                                {[
                                                    { id: "visiblePolicies", label: "Policies", state: visiblePolicies, setter: setVisiblePolicies },
                                                    { id: "visibleAccessibility", label: "Accessibility", state: visibleAccessibility, setter: setVisibleAccessibility },
                                                    { id: "visibleInventory", label: "Inventory", state: visibleInventory, setter: setVisibleInventory },
                                                    { id: "visiblePrioritizedContent", label: "Prioritized Content", state: visiblePrioritizedContent, setter: setVisiblePrioritizedContent },
                                                    { id: "visiblePerformance", label: "Performance", state: visiblePerformance, setter: setVisiblePerformance },
                                                ].map(({ id, label, state, setter }) => (
                                                    <div key={id} className="form-check form-switch mb-2 ms-3">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={id}
                                                            checked={state}
                                                            onChange={(e) => setter(e.target.checked)}
                                                        />
                                                        <label className="form-check-label" htmlFor={id}>{label}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="row g-3 mt-1 border-top">
                                            <div className="col-12">
                                                <div className="form-check form-switch mb-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="isAccountAdmin"
                                                        checked={isAccountAdmin}
                                                        onChange={(e) => setIsAccountAdmin(e.target.checked)}
                                                    />
                                                    <label className="form-check-label" htmlFor="isAccountAdmin">
                                                        User is account administrator
                                                    </label>
                                                </div>

                                                <div className="form-check form-switch mb-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="enableExportEmailNotification"
                                                        checked={enableExportEmailNotification}
                                                        onChange={(e) => setEnableExportEmailNotification(e.target.checked)}
                                                    />
                                                    <label className="form-check-label" htmlFor="enableExportEmailNotification">
                                                        Enable Export Email Notification
                                                    </label>
                                                </div>

                                                <div className="form-check form-switch mb-0">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="sendWelcomeMail"
                                                        checked={sendWelcomeMail}
                                                        onChange={(e) => setSendWelcomeMail(e.target.checked)}
                                                    />
                                                    <label className="form-check-label" htmlFor="sendWelcomeMail">
                                                        Send welcome mail on creation
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Domains Section - Full Width */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card add-domain-card border-0 shadow-sm mb-4">
                        <div className="card-header add-domain-card-header bg-white border-0 py-3 px-4 d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                                <i className="isax isax-global text-primary"></i>
                                <h5 className="mb-0 fw-semibold">Domains</h5>
                            </div>
                            <button
                                className="btn btn-link btn-sm p-0 text-muted"
                                type="button"
                                onClick={() => setOpenDomains((v) => !v)}
                                aria-expanded={openDomains}
                            >
                                <i className={`isax ${openDomains ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}></i>
                            </button>
                        </div>

                        {openDomains && (
                            <div id="domains-section">
                                <div className="card-body pt-0 px-4 pb-4">
                                    <h6 className="fw-semibold text-body text-muted mb-3">Domains</h6>
                                    <div className="border rounded overflow-hidden">
                                        <table className="table table-hover table-borderless mb-0 add-user-domains-table">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="fw-semibold text-body py-3 ps-3">Domains</th>
                                                    <th className="fw-semibold text-body py-3">URL</th>
                                                    <th className="fw-semibold text-body py-3 text-end">
                                                        <span className="me-2">Visible</span>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={domains.length > 0 && domains.every((d) => d.visible)}
                                                            onChange={(e) => setDomains((prev) => prev.map((d) => ({ ...d, visible: e.target.checked })))}
                                                            aria-label="Select all Visible"
                                                        />
                                                    </th>
                                                    <th className="fw-semibold text-body py-3 pe-3 text-end">
                                                        <span className="me-2">Send report</span>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={domains.length > 0 && domains.every((d) => d.sendReport)}
                                                            onChange={(e) => setDomains((prev) => prev.map((d) => ({ ...d, sendReport: e.target.checked })))}
                                                            aria-label="Select all Send report"
                                                        />
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {domains.map((domain) => (
                                                    <tr key={domain.id}>
                                                        <td className="ps-3 py-2 align-middle">{domain.name}</td>
                                                        <td className="py-2 align-middle text-muted small">{domain.url || "-"}</td>
                                                        <td className="text-end py-2 align-middle">
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={domain.visible}
                                                                onChange={(e) =>
                                                                    setDomains((prev) =>
                                                                        prev.map((d) => (d.id === domain.id ? { ...d, visible: e.target.checked } : d))
                                                                    )
                                                                }
                                                                aria-label={`Visible for ${domain.name}`}
                                                            />
                                                        </td>
                                                        <td className="pe-3 text-end py-2 align-middle">
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={domain.sendReport}
                                                                onChange={(e) =>
                                                                    setDomains((prev) =>
                                                                        prev.map((d) => (d.id === domain.id ? { ...d, sendReport: e.target.checked } : d))
                                                                    )
                                                                }
                                                                aria-label={`Send report for ${domain.name}`}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="add-domain-actions d-flex gap-2 mt-4 pt-3 border-top justify-content-end">
                <button
                    type="button"
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                    {isEditMode ? "Update profile" : "Save User"}
                </button>
                <Link className="btn btn-light border text-body" to="/home/users">
                    Cancel
                </Link>
            </div>
        </div>
    );
};

export default UpdateProfile;
