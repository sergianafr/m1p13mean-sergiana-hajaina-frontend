export type DashboardMonthlyPoint = {
  revenue: number;
  nombreVentes: number;
};

export type AdminDashboardSummary = {
  magasinsCount: number;
  users: {
    total: number;
    admins: number;
    boutiques: number;
    clients: number;
  };
  boxes: {
    total: number;
    occupes: number;
    libres: number;
  };
  loyersRecent: {
    revenue: number;
  };
  promotions: {
    actives: number;
    expirentBientot: number;
  };
};

export type AdminMagasinAvisStat = {
  magasinId: string;
  nomMagasin: string;
  avisMoyen: number;
  nombreAvis: number;
  avisMonthly: Array<{ avisMoyen: number; nombreAvis: number }>; // 12 mois
};

export type AdminDashboard = {
  generatedAt: string;
  annee: number;
  recentDays: number;
  summary: AdminDashboardSummary;
  totalRevenueYear: number;
  magasinsAvis: AdminMagasinAvisStat[];
};

export type BoutiqueDashboardSummary = {
  produitsCount: number;
  promotionsActives: number;
  promotionsExpirentBientot: number;
  ventesRecent: {
    nombreVentes: number;
    revenue: number;
    clientsUniques: number;
  };
  avisMagasin: {
    avisMoyen: number;
    nombreAvis: number;
  };
};

export type BoutiqueStockAlertProduit = {
  produitId: string;
  nomProduit: string;
  photos: Array<{ url?: string; dateAjout?: string | Date }>;
  seuilNotification: number | null;
  stockActuel: number;
};

export type BoutiqueStockAlerts = {
  count: number;
  produits: BoutiqueStockAlertProduit[];
};

export type BoutiqueTopProduit = {
  produitId: string;
  nomProduit: string;
  qteVendue: number;
  revenue: number;
};

export type BoutiqueDashboard = {
  generatedAt: string;
  annee: number;
  recentDays: number;
  magasin: {
    magasinId: string;
    nomMagasin: string;
  };
  summary: BoutiqueDashboardSummary;
  monthly: DashboardMonthlyPoint[]; // 12 points
  stockAlerts: BoutiqueStockAlerts;
  topProduits: BoutiqueTopProduit[];
};
