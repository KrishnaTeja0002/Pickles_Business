export interface CourierPartner {
  id: string;
  name: string;
  shortName: string;
  portalUrl: string;
  logoText: string;
  badgeBg: string;
  badgeColor: string;
  getTrackingUrl: (awb: string) => string;
}

export const COURIER_PARTNERS: Record<string, CourierPartner> = {
  bluedart: {
    id: "bluedart",
    name: "Blue Dart Express",
    shortName: "Blue Dart",
    portalUrl: "https://www.bluedart.com",
    logoText: "BLUE DART",
    badgeBg: "#e0f2fe",
    badgeColor: "#0369a1",
    getTrackingUrl: (awb) => `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${encodeURIComponent(awb.trim())}`,
  },
  delhivery: {
    id: "delhivery",
    name: "Delhivery Logistics",
    shortName: "Delhivery",
    portalUrl: "https://www.delhivery.com",
    logoText: "DELHIVERY",
    badgeBg: "#fee2e2",
    badgeColor: "#b91c1c",
    getTrackingUrl: (awb) => `https://www.delhivery.com/track/package/${encodeURIComponent(awb.trim())}`,
  },
  dtdc: {
    id: "dtdc",
    name: "DTDC Express",
    shortName: "DTDC",
    portalUrl: "https://www.dtdc.in",
    logoText: "DTDC",
    badgeBg: "#fef3c7",
    badgeColor: "#b45309",
    getTrackingUrl: (awb) => `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCNNo=${encodeURIComponent(awb.trim())}`,
  },
  indiapost: {
    id: "indiapost",
    name: "India Post (Speed Post)",
    shortName: "India Post",
    portalUrl: "https://www.indiapost.gov.in",
    logoText: "INDIA POST",
    badgeBg: "#fce7f3",
    badgeColor: "#be185d",
    getTrackingUrl: (_awb) => `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`,
  },
  shiprocket: {
    id: "shiprocket",
    name: "Shiprocket",
    shortName: "Shiprocket",
    portalUrl: "https://shiprocket.co",
    logoText: "SHIPROCKET",
    badgeBg: "#ede9fe",
    badgeColor: "#6d28d9",
    getTrackingUrl: (awb) => `https://shiprocket.co/tracking/${encodeURIComponent(awb.trim())}`,
  },
  ekart: {
    id: "ekart",
    name: "Ekart Logistics",
    shortName: "Ekart",
    portalUrl: "https://ekartlogistics.com",
    logoText: "EKART",
    badgeBg: "#dbeafe",
    badgeColor: "#1d4ed8",
    getTrackingUrl: (awb) => `https://ekartlogistics.com/shipmenttrack/${encodeURIComponent(awb.trim())}`,
  },
  shadowfax: {
    id: "shadowfax",
    name: "Shadowfax",
    shortName: "Shadowfax",
    portalUrl: "https://tracker.shadowfax.in",
    logoText: "SHADOWFAX",
    badgeBg: "#ffedd5",
    badgeColor: "#c2410c",
    getTrackingUrl: (awb) => `https://tracker.shadowfax.in/#/track/${encodeURIComponent(awb.trim())}`,
  },
  ecomexpress: {
    id: "ecomexpress",
    name: "Ecom Express",
    shortName: "Ecom Express",
    portalUrl: "https://ecomexpress.in",
    logoText: "ECOM EXPRESS",
    badgeBg: "#f3f4f6",
    badgeColor: "#374151",
    getTrackingUrl: (awb) => `https://ecomexpress.in/tracking/?awb_number=${encodeURIComponent(awb.trim())}`,
  },
};

export function identifyCourierPartner(courierName?: string | null): CourierPartner | null {
  if (!courierName) return null;
  const key = courierName.toLowerCase().replace(/[^a-z0-9]/g, "");

  for (const [id, partner] of Object.entries(COURIER_PARTNERS)) {
    if (key.includes(id) || key.includes(partner.shortName.toLowerCase().replace(/[^a-z0-9]/g, ""))) {
      return partner;
    }
  }
  return null;
}

export function getCourierTrackingUrl(courierName?: string | null, awbNumber?: string | null): string | null {
  if (!awbNumber) return null;
  const partner = identifyCourierPartner(courierName);
  if (partner) {
    return partner.getTrackingUrl(awbNumber);
  }
  const cleanAwb = encodeURIComponent(awbNumber.trim());
  if (courierName) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${courierName.trim()} tracking ${cleanAwb}`)}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`courier tracking ${cleanAwb}`)}`;
}
