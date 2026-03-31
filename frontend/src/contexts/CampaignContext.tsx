import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface Campaign {
  id: string;
  name: string;
  product: string;
  platforms: string[];
  created_at: string;
}

interface CampaignContextType {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  setSelectedCampaign: (c: Campaign) => void;
  loading: boolean;
}

const CampaignContext = createContext<CampaignContextType>({
  campaigns: [],
  selectedCampaign: null,
  setSelectedCampaign: () => {},
  loading: false,
});

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    fetch('http://localhost:3001/campaigns', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return [];
        }
        return r.json();
      })
      .then((data: Campaign[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCampaigns(data);
          setSelectedCampaign(data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <CampaignContext.Provider value={{ campaigns, selectedCampaign, setSelectedCampaign, loading }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  return useContext(CampaignContext);
}
