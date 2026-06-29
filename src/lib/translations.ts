export type Language = "id" | "en";

export const translations = {
  id: {
    // Sidebar Navigation
    dashboard: "Dashboard",
    inbox: "Kotak Masuk Terpadu",
    contacts: "Kontak / CRM",
    products: "Produk & Layanan",
    booking: "Reservasi / Pemesanan",
    broadcast: "Siaran / Kampanye",
    channels: "Saluran Hubung",
    reports: "Laporan & Analisis",
    settings: "Tim & Pengaturan",
    automation: "Otomatisasi",
    conversations: "Alur Percakapan",
    aiAgents: "Agen AI",
    knowledgeBase: "Basis Pengetahuan",
    chatbotSettings: "Pengaturan Chatbot",
    
    // Topbar & Shared
    workspace: "Workspace",
    systemActive: "Sistem aktif",
    logout: "Keluar",
    accountProfile: "Profil Akun",
    
    // Settings Profile
    profileSettingsTitle: "Pengaturan Profil Workspace",
    profileSettingsDesc: "Ubah identitas profil bengkel, deskripsi, alamat, dan jam operasional bisnis Anda.",
    workspaceName: "Nama Workspace",
    industry: "Industri",
    emailSupport: "Email Dukungan (Support)",
    businessDesc: "Deskripsi Bisnis",
    address: "Alamat Lengkap",
    businessHours: "Jam Operasional",
    timezone: "Zona Waktu",
    defaultLang: "Bahasa Default Sistem",
    saveProfile: "Simpan Profil",
    successSaveProfile: "Profil Workspace berhasil diperbarui!",
  },
  en: {
    // Sidebar Navigation
    dashboard: "Dashboard",
    inbox: "Unified Inbox",
    contacts: "Contacts / CRM",
    products: "Products & Services",
    booking: "Booking & Reservation",
    broadcast: "Broadcast / Campaign",
    channels: "Channels",
    reports: "Reports & Analytics",
    settings: "Team & Settings",
    automation: "Automation",
    conversations: "Conversations",
    aiAgents: "AI Agents",
    knowledgeBase: "Knowledge Base",
    chatbotSettings: "Chatbot Settings",
    
    // Topbar & Shared
    workspace: "Workspace",
    systemActive: "System active",
    logout: "Logout",
    accountProfile: "Account Profile",
    
    // Settings Profile
    profileSettingsTitle: "Workspace Profile Settings",
    profileSettingsDesc: "Change your workshop profile identity, description, address, and business hours.",
    workspaceName: "Workspace Name",
    industry: "Industry",
    emailSupport: "Support Email",
    businessDesc: "Business Description",
    address: "Full Address",
    businessHours: "Business Hours",
    timezone: "Timezone",
    defaultLang: "System Default Language",
    saveProfile: "Save Profile",
    successSaveProfile: "Workspace Profile updated successfully!",
  }
};

export function getTranslation(lang: string | undefined) {
  const code = (lang === "en" ? "en" : "id") as Language;
  return translations[code];
}
