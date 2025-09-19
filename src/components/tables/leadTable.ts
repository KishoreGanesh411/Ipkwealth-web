// src/components/tables/leadTable.ts
export interface LeadTableHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onReset: () => void;
  downloadOpen: boolean;
  toggleDownload: () => void;
  exportCSV: () => void;
  exportXLSX: () => void;
}

export type AssignedRM = "Ramyapriya" | "Haripriya" | "Bharath";

export interface Row {
  id: string;          // IPK-000001 after Generate Lead; temp rows can be TMP-****
  name?: string;
  phone?: string;
  source?: string;     // lead source
  createdAt?: string;  // ISO string
  assignedRm?: AssignedRM;
  selected?: boolean;
}

export interface LeadRowProps {
  lead: {
    id: string;
    name?: string;
    phone?: string;
    source?: string;
    createdAt?: string;
    assignedRm?: AssignedRM;
    selected?: boolean;
  };
  onSelect: (id: string, checked: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface LeadTableFooterProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (page: number) => void;
  generateLead: () => void;
}
