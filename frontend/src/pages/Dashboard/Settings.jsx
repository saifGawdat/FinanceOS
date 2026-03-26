import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Modal from "../../components/ui/Modal";
import { useAuth } from "../../context/AuthContext";
import {
  IoTrashOutline,
  IoWarningOutline,
  IoCheckmarkCircle,
  IoDownloadOutline,
  IoPhonePortraitOutline,
  IoSaveOutline,
} from "react-icons/io5";

const Settings = () => {
  const { deleteAccount, updateProfile, user } = useAuth();
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
      setPhoneError("Failed to save phone number. Please try again.");
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
      setDeleteError("An unexpected error occurred. Please try again.");
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
        <div className="mb-12">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            System <span className="text-gray-500">Configuration</span>
          </h1>
          <p className="text-[10px] font-black text-gray-500 mt-2 uppercase tracking-[0.2em]">
            Core preferences and security management
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Profile Section */}
            <section className="bg-[#0e0e12] rounded-2xl shadow-2xl p-8 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <IoPhonePortraitOutline className="text-blue-500" size={20} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Communication</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">WhatsApp integration profile</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4 ml-1">
                    System Phone Number
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+00 000 000 000"
                      className="flex-1 px-5 py-4 bg-[#09090c] border border-white/5 rounded-xl text-xs font-bold text-white placeholder-gray-700 focus:outline-none focus:border-blue-500/30 transition-all shadow-inner"
                    />
                    <button
                      onClick={handleSavePhone}
                      disabled={isSavingPhone}
                      className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-20 text-[10px] font-black uppercase tracking-widest text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap"
                    >
                      <IoSaveOutline size={16} />
                      {isSavingPhone ? "SYNCING..." : "COMMIT"}
                    </button>
                  </div>

                  {phoneSaved && (
                    <div className="mt-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/5 border border-blue-500/10 px-5 py-3 rounded-xl animate-pulse">
                      <IoCheckmarkCircle size={14} />
                      Registry Updated Successfully
                    </div>
                  )}
                  {phoneError && (
                    <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/5 border border-red-500/10 px-5 py-3 rounded-xl animate-shake">
                      {phoneError}
                    </div>
                  )}
                  <p className="text-[8px] font-black text-gray-700 mt-4 uppercase tracking-widest leading-relaxed">
                    CRITICAL: Ensure international prefix (e.g., +20) is included for automated WhatsApp dispatch logic.
                  </p>
                </div>
              </div>
            </section>

            {!isStandalone && (
              <section className="bg-[#0e0e12] rounded-2xl shadow-2xl p-8 border border-white/5 relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <IoDownloadOutline className="text-indigo-500" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Application</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Standardize accessibility</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <p className="text-lg font-black text-white uppercase tracking-tight">System PWA</p>
                    <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase tracking-widest">Enable standalone infrastructure</p>
                  </div>
                  <button
                    className="flex items-center gap-3 px-8 py-4 bg-[#09090c] border border-white/5 hover:border-white/10 text-[10px] font-black uppercase tracking-widest text-white rounded-xl transition-all shadow-xl group/btn"
                    onClick={() => setShowInstallModal(true)}
                  >
                    <IoDownloadOutline size={16} className="group-hover:translate-y-0.5 transition-transform" />
                    Deploy to Local
                  </button>
                </div>
              </section>
            )}
          </div>

          <div>
            {/* Danger Zone Section */}
            <section className="bg-[#0e0e12] rounded-2xl shadow-2xl p-8 border border-red-900/10 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/2 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <IoWarningOutline className="text-red-500" size={20} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-red-500 uppercase tracking-[0.2em]">Security Protocol</h2>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">Terminal operations</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-8 bg-red-500/1 rounded-2xl border border-red-500/5 hover:border-red-500/10 transition-all flex flex-col justify-between h-[300px]">
                  <div>
                    <h3 className="text-lg font-black text-gray-200 uppercase tracking-tight">Erase Credentials</h3>
                    <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-[0.15em] leading-relaxed">
                      Executing this utility will purge all records from the distributed ledger. This action is irreversible and terminates the authentication lease.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-[#09090c] border border-red-500/20 hover:bg-red-500/5 text-red-500 rounded-xl transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-xl"
                  >
                    <IoTrashOutline size={18} />
                    Initiate Termination
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
          title="Infrastructure Deployment"
        >
          <div className="space-y-8 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
              Confirm standalone application provisioning? This enables cached access and dedicated shell UI.
            </p>
            {installError && (
              <div className="text-[10px] font-black px-5 py-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 uppercase tracking-widest">
                {installError}
              </div>
            )}
            <div className="flex gap-4 border-t border-white/5 pt-8">
              <Button
                variant="secondary"
                className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest"
                onClick={() => setShowInstallModal(false)}
              >
                Abort
              </Button>
              <Button
                className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20"
                onClick={installApp}
              >
                Proceed
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && !deleteSuccess && resetDeleteModal()}
        title="Access Termination"
      >
        <div className="space-y-8 p-4">
          {deleteSuccess ? (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 animate-pulse">
                <IoCheckmarkCircle className="text-blue-500" size={48} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                Memory Purged
              </h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Account dissolution finalized. Neutralizing session...
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-4 p-6 bg-red-500/5 rounded-2xl border border-red-500/10">
                <IoWarningOutline
                  className="text-red-500 shrink-0 mt-0.5"
                  size={24}
                />
                <div>
                  <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.1em] mb-2">
                    CRITICAL WARNING
                  </h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                    Dissolution is irreversible. All transactional records, ledger entries, and profile metadata will be permanently neutralized.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label
                  htmlFor="delete-confirm"
                  className="block text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1"
                >
                  Confirm Authorization Key
                </label>
                <input
                  type="text"
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) =>
                    setDeleteConfirmText(e.target.value.toUpperCase())
                  }
                  placeholder="TYPE 'DELETE' TO CONFIRM"
                  disabled={isDeleting}
                  className="w-full px-6 py-4 bg-[#09090c] border border-white/5 rounded-2xl text-xs font-black text-white placeholder-gray-800 focus:outline-none focus:border-red-500/30 transition-all disabled:opacity-20 uppercase"
                />
              </div>

              {deleteError && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{deleteError}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  onClick={resetDeleteModal}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-[#09090c] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white rounded-2xl transition-all disabled:opacity-20"
                >
                  Cancel
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
                      Purge
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
