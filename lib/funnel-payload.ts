export type FunnelPayload = {
  analysis: {
    verbrauch?: number;
    arbeitspreis?: number;
    grundpreis?: number;
    vertragsende?: string;
  };
  lead: {
    vorname: string;
    email: string;
    telefon?: string;
  };
};
