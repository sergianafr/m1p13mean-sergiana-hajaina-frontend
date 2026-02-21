export type ColumnType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'boolean' 
  | 'currency'
  | 'custom';

export interface ColumnConfig {
  key: string;
  label: string;
  type?: ColumnType;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown) => string;
  cellClass?: string | ((row: unknown) => string);
  visible?: boolean;
}

export interface TableAction {
  label: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn';
  visible?: (row: unknown) => boolean;
  handler: (row: unknown) => void;
}

export interface DynamicTableConfig {
  columns: ColumnConfig[];
  actions?: TableAction[];
  rowRoute?: string; 
  idField?: string;
  clickable?: boolean; 
  showActions?: boolean; 
  emptyMessage?: string;
  loading?: boolean;
  pageable?: boolean;
  pageSize?: number;
  totalItems?: number;
}

export interface TableRowClickEvent {
  row: unknown;
  id: string | number;
}
