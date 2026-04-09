import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import {
  IoTrashOutline,
  IoWarningOutline,
  IoCheckmarkCircle,
  IoDownloadOutline,
  IoPhonePortraitOutline,
  IoSaveOutline,
  IoLanguageOutline,
} from "react-icons/io5";

const Settings = () => {
  const { deleteAccount, updateProfile, user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Phone number / profile state
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handleSavePhone = async () => {
    setIsSavingPhone(true);
    setPhoneError("");
    setPhoneSaved(false);
    try {
      await updateProfile({ phoneNumber: phoneNumber.trim() });
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 3000);
    } catch {
      setPhoneError(t("common.error_process"));
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setDeleteError("");
    setIsDeleting(true);

    try {
      const result = await deleteAccount();

      if (result.success) {
        setDeleteSuccess(true);
        // Wait a moment to show success, then redirect
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setDeleteError(result.error);
        setIsDeleting(false);
      }
    } catch {
      setDeleteError(t("common.error_process"));
      setIsDeleting(false);
    }
  };

  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText("");
    setDeleteError("");
    setIsDeleting(false);
    setDeleteSuccess(false);
  };

  // install app state
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installError, setInstallError] = useState("");

  React.useEffect(() => {
    // Check if app is already running in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser from showing its own prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      // If prompt isn't available, show guidance inside the modal
      setInstallError(
        "Please use your browser's menu (Add to home screen) to install.",
      );
      return;
    }

    setShowInstallModal(false);
    setInstallError("");
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    setDeferredPrompt(null);
  };
  return (
    <DashboardLayout>
      <div className="max-w-[1440px] mx-auto p-8">
        {/* Page Header */}
        <div className="mb-12 rtl:text-right">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            {t("settings.main_title")}{" "}
            <span className="text-gray-500">{t("settings.interface")}</span>
          </h1>
          <p className="text-[10px] font-black text-gray-500 mt-2 uppercase tracking-[0.2em]">
            {t("settings.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Regional Settings section */}
            <section className="bg-[#0e0e12] rounded-2xl shadow-2xl p-8 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />
              
              <div className="flex items-center gap-4 mb-8 rtl:flex-row-reverse">
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <IoLanguageOutline className="text-emerald-500" size={20} />
                </div>
                <div className="rtl:text-right">
                  <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">{t("settings.regional.title")}</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{t("settings.regional.subtitle")}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4 ml-1 rtl:mr-1 rtl:ml-0 rtl:text-right">
                    {t("settings.regional.language")}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => i18n.changeLanguage("en")}
                      className={`px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        i18n.language === "en"
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20"
                          : "bg-[#09090c] text-gray-500 border-white/5 hover:border-white/10"
                      }`}
                    >
                      {t("settings.regional.en")}
                    </button>
                    <button
                      onClick={() => i18n.changeLanguage("ar")}
                      className={`px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        i18n.language === "ar"
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20"
                          : "bg-[#09090c] text-gray-500 border-white/5 hover:border-white/10"
                      }`}
                    >
                      {t("settings.regional.ar")}
                    </button>
                  </div>
                  <p className="text-[8px] font-black text-gray-700 mt-4 uppercase tracking-widest leading-relaxed rtl:text-right">
                    {t("settings.regional.select")}
                  </p>
                </div>
              </div>
            </section>

            {/* Profile Section */}
            <section className="bg-[#0e0e12] rounded-2xl shadow-2xl p-8 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
              
              <div className="flex items-center gap-4 mb-8 rtl:flex-row-reverse">
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <IoPhonePortraitOutline className="text-blue-500" size={20} />
                </div>
                <div className="rtl:text-right">
                  <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">{t("settings.profile.title")}</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{t("settings.profile.subtitle")}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4 ml-1 rtl:mr-1 rtl:ml-0 rtl:text-right">
                    {t("settings.profile.label")}
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+00 000 000 000"
                      className="flex-1 px-5 py-4 bg-[#09090c] border border-white/5 rounded-xl text-xs font-bold text-white placeholder-gray-700 focus:outline-none focus:border-blue-500/30 transition-all shadow-inner rtl:text-right"
                    />
                    <button
                      onClick={handleSavePhone}
                      disabled={isSavingPhone}
                      className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-20 text-[10px] font-black uppercase tracking-widest text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap"
                    >
                      <IoSaveOutline size={16} />
                      {isSavingPhone ? t("settings.profile.syncing") : t("settings.profile.button")}
                    </button>
                  </div>

                  {phoneSaved && (
                    <div className="mt-4 flex items-center gap-3 rtl:flex-row-reverse text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/5 border border-blue-500/10 px-5 py-3 rounded-xl animate-pulse">
                      <IoCheckmarkCircle size={14} />
                      {t("settings.profile.success")}
                    </div>
                  )}
                  {phoneError && (
                    <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/5 border border-red-500/10 px-5 py-3 rounded-xl animate-shake rtl:text-right">
                      {phoneError}
                    </div>
                  )}
                  <p className="text-[8px] font-black text-gray-700 mt-4 uppercase tracking-widest leading-relaxed rtl:text-right">
                    {t("settings.profile.warning")}
                  </p>
                </div>
              </div>
            </section>

            {!isStandalone && (
                <section className="bg-[#0e0e12] rounded-2xl shadow-2xl p-8 border border-white/5 relative overflow-hidden group">
                  <div className="absolute bottom-0 right-0 rtl:right-auto rtl:left-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />
                  
                  <div className="flex items-center gap-4 mb-8 rtl:flex-row-reverse">
                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                      <IoDownloadOutline className="text-indigo-500" size={20} />
                    </div>
                  <div>
                    <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">{t("settings.application.title")}</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{t("settings.application.subtitle")}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="rtl:text-right">
                    <p className="text-lg font-black text-white uppercase tracking-tight">{t("settings.application.pwa")}</p>
                    <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase tracking-widest">{t("settings.application.pwa_sub")}</p>
                  </div>
                  <button
                    className="flex items-center gap-3 rtl:flex-row-reverse px-8 py-4 bg-[#09090c] border border-white/5 hover:border-white/10 text-[10px] font-black uppercase tracking-widest text-white rounded-xl transition-all shadow-xl group/btn"
                    onClick={() => setShowInstallModal(true)}
                  >
                    <IoDownloadOutline size={16} className="group-hover:translate-y-0.5 transition-transform" />
                    {t("settings.application.deploy")}
                  </button>
                </div>
              </section>
            )}
          </div>

          <div>
            {/* Danger Zone Section */}
            <section className="bg-[#0e0e12] rounded-2xl shadow-2xl p-8 border border-red-900/10 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/2 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="flex items-center gap-4 mb-8 rtl:flex-row-reverse">
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <IoWarningOutline className="text-red-500" size={20} />
                </div>
                <div className="rtl:text-right">
                  <h2 className="text-xs font-black text-red-500 uppercase tracking-[0.2em]">{t("settings.security.title")}</h2>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">{t("settings.security.subtitle")}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-8 bg-red-500/1 rounded-2xl border border-red-500/5 hover:border-red-500/10 transition-all flex flex-col justify-between h-[300px]">
                  <div className="rtl:text-right">
                    <h3 className="text-lg font-black text-gray-200 uppercase tracking-tight">{t("settings.security.erase")}</h3>
                    <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-widest leading-relaxed">
                      {t("settings.security.erase_sub")}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-[#09090c] border border-red-500/20 hover:bg-red-500/5 text-red-500 rounded-xl transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-xl"
                  >
                    <IoTrashOutline size={18} />
                    {t("settings.security.button")}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {showInstallModal && (
        <Modal
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
          title={t("settings.modals.pwa_title")}
        >
          <div className="space-y-8 p-4">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative group">
                <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full group-hover:bg-blue-500/30 transition-all"></div>
                <img 
                  src="/icon-512.png" 
                  alt="FinanceOS Icon" 
                  className="w-32 h-32 rounded-[2rem] shadow-2xl relative border border-white/10"
                />
              </div>
              <div className="mt-8 text-center">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">FinanceOS</h3>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1 italic">Enterprise Mobility Ready</p>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed text-center px-4">
              {t("settings.modals.pwa_confirm")}
            </p>

            {installError && (
              <div className="text-[10px] font-black px-5 py-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 uppercase tracking-widest text-center">
                {installError}
              </div>
            )}
            <div className="flex gap-4 border-t border-white/5 pt-8 rtl:flex-row-reverse">
              <Button
                variant="secondary"
                className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest"
                onClick={() => setShowInstallModal(false)}
              >
                {t("settings.modals.abort")}
              </Button>
              <Button
                className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20"
                onClick={installApp}
              >
                {t("settings.modals.proceed")}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && !deleteSuccess && resetDeleteModal()}
        title={t("settings.modals.delete_title")}
      >
        <div className="space-y-8 p-4">
          {deleteSuccess ? (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 animate-pulse">
                <IoCheckmarkCircle className="text-blue-500" size={48} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                {t("settings.modals.delete_success_title")}
              </h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {t("settings.modals.delete_success_sub")}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-4 p-6 bg-red-500/5 rounded-2xl border border-red-500/10 rtl:flex-row-reverse">
                <IoWarningOutline
                  className="text-red-500 shrink-0 mt-0.5"
                  size={24}
                />
                <div className="rtl:text-right">
                  <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">
                    {t("settings.modals.delete_warning_title")}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                    {t("settings.modals.delete_warning")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label
                  htmlFor="delete-confirm"
                  className="block text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1 rtl:mr-1 rtl:ml-0 rtl:text-right"
                >
                  {t("settings.modals.delete_label")}
                </label>
                <input
                  type="text"
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) =>
                    setDeleteConfirmText(e.target.value.toUpperCase())
                  }
                  placeholder={t("settings.modals.delete_placeholder")}
                  disabled={isDeleting}
                  className="w-full px-6 py-4 bg-[#09090c] border border-white/5 rounded-2xl text-xs font-black text-white placeholder-gray-800 focus:outline-none focus:border-red-500/30 transition-all disabled:opacity-20 uppercase rtl:text-right"
                />
              </div>

              {deleteError && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl rtl:text-right">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{deleteError}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-white/5 rtl:flex-row-reverse">
                <button
                  onClick={resetDeleteModal}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-[#09090c] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white rounded-2xl transition-all disabled:opacity-20"
                >
                  {t("settings.modals.delete_cancel")}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== "DELETE"}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-20 shadow-lg shadow-red-600/20 flex items-center justify-center gap-3"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <IoTrashOutline size={18} />
                      {t("settings.modals.delete_purge")}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Settings;
