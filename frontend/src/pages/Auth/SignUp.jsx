import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(formData.name, formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Google login failed");
    }
  };

  const { t } = useTranslation();

  return (
    <AuthLayout>
      <div className="rtl:text-right">
        <h2 className="text-3xl font-bold text-gray-100 mb-2 text-center">
          {t("auth.signup.title")}
        </h2>
        <p className="text-gray-400 mb-6 text-center">
          {t("auth.signup.subtitle")}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4 text-center text-xs font-bold uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label={t("auth.signup.name")}
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t("auth.signup.name_placeholder")}
            required
          />
          <Input
            label={t("auth.signup.email")}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t("auth.signup.email_placeholder")}
            required
          />
          <Input
            label={t("auth.signup.password")}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t("auth.signup.password_placeholder")}
            required
          />
          <Button type="submit" className="w-full">
            {t("auth.signup.submit")}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">
              {t("auth.login.or")}
            </span>
          </div>
        </div>

        <div className="flex justify-center mt-2">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError(t("auth.login.google_failed"))}
            theme="filled_blue"
            shape="pill"
            size="large"
            text="signup_with"
            width="340"
          />
        </div>

        <p className="text-center text-gray-400 mt-6">
          {t("auth.signup.have_account")}{" "}
          <Link
            to="/login"
            className="text-blue-400 font-semibold hover:text-blue-300"
          >
            {t("auth.signup.login_link")}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
