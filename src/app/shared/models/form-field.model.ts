export type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'date' 
  | 'radio';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface FormFieldConfig {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  validators?: FieldValidator[];
  options?: SelectOption[];
  rows?: number; 
  min?: number;
  max?: number; 
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  errorMessages?: Record<string, string>;
  hint?: string;
  class?: string; 
}

export interface FieldValidator {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern';
  value?: string | number;
  message: string;
}

export type FormMode = 'create' | 'edit';

export interface DynamicFormConfig {
  fields: FormFieldConfig[];
  submitLabel?: string;
  cancelLabel?: string;
  mode?: FormMode;
}
