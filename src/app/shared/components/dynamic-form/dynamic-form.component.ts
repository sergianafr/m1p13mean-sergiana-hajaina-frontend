import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  OnInit,
  effect,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { finalize } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  DynamicFormConfig,
  FormFieldConfig,
  FormMode
} from '../../models/form-field.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'dynamic-form',
  standalone: true,
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class DynamicFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Inputs
  readonly config = input.required<DynamicFormConfig>();
  readonly initialData = input<Record<string, unknown>>();
  readonly loading = input<boolean>(false);
  readonly showDelete = input<boolean>(false);

  // Outputs
  readonly formSubmit = output<Record<string, unknown>>();
  readonly formCancel = output<void>();
  readonly formDelete = output<void>();

  // Internal state
  protected readonly form = signal<FormGroup | null>(null);
  protected readonly isFormValid = signal<boolean>(false);
  protected readonly deletingImageUrls = signal<Record<string, boolean>>({});
  protected readonly deletedImageUrls = signal<string[]>([]);

  protected readonly existingImageUrls = computed<Record<string, string[]>>(() => {
    const data = this.initialData();
    const fields = this.config().fields;
    const deleted = this.deletedImageUrls();
    
    if (!data) {
      return {};
    }

    const result: Record<string, string[]> = {};
    for (const field of fields) {
      if (field.type !== 'file') {
        continue;
      }

      const fieldKey = field.existingImageField ?? field.key;
      const allUrls = this.extractImageUrls(data[fieldKey]);
      result[fieldKey] = allUrls.filter((url) => !deleted.includes(url));
    }

    return result;
  });

  protected readonly mode = computed<FormMode>(
    () => this.config().mode ?? 'create'
  );

  protected readonly submitLabel = computed(() => {
    if (this.config().submitLabel) {
      return this.config().submitLabel;
    }
    return this.mode() === 'create' ? 'Créer' : 'Modifier';
  });

  protected readonly cancelLabel = computed(
    () => this.config().cancelLabel ?? 'Annuler'
  );

  constructor() {
    // Effect to update form values when initialData changes
    effect(() => {
      const data = this.initialData();
      const currentForm = this.form();
      if (data && currentForm) {
        currentForm.patchValue(data);
      }
    });
  }

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    const group: Record<string, unknown[]> = {};

    for (const field of this.config().fields) {
      const validators = this.getValidators(field);
      const initialValue = this.initialData()?.[field.key] ?? (field.type === 'file' ? [] : '');
      group[field.key] = [
        { value: initialValue, disabled: field.disabled ?? false },
        validators
      ];
    }

    const formGroup = this.fb.group(group);
    
    // Subscribe to form status changes to update validation signal
    formGroup.statusChanges.subscribe(() => {
      this.isFormValid.set(formGroup.valid);
    });
    
    // Set initial validity
    this.isFormValid.set(formGroup.valid);
    this.form.set(formGroup);
  }

  private getValidators(field: FormFieldConfig): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    if (field.required) {
      if (field.type === 'file') {
        validators.push(this.fileRequiredValidator(field));
      } else {
        validators.push(Validators.required);
      }
    }

    if (field.type === 'email') {
      validators.push(Validators.email);
    }

    if (field.minLength !== undefined) {
      validators.push(Validators.minLength(field.minLength));
    }

    if (field.maxLength !== undefined) {
      validators.push(Validators.maxLength(field.maxLength));
    }

    if (field.min !== undefined) {
      validators.push(Validators.min(field.min));
    }

    if (field.max !== undefined) {
      validators.push(Validators.max(field.max));
    }

    if (field.pattern) {
      validators.push(Validators.pattern(field.pattern));
    }

    // Custom validators from config
    if (field.validators) {
      for (const validator of field.validators) {
        switch (validator.type) {
          case 'required':
            validators.push(Validators.required);
            break;
          case 'email':
            validators.push(Validators.email);
            break;
          case 'minLength':
            validators.push(Validators.minLength(validator.value as number));
            break;
          case 'maxLength':
            validators.push(Validators.maxLength(validator.value as number));
            break;
          case 'min':
            validators.push(Validators.min(validator.value as number));
            break;
          case 'max':
            validators.push(Validators.max(validator.value as number));
            break;
          case 'pattern':
            validators.push(Validators.pattern(validator.value as string));
            break;
        }
      }
    }

    return validators;
  }

  private fileRequiredValidator(field: FormFieldConfig): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const existing = this.getExistingImages(field);
      if (existing.length > 0) {
        return null;
      }

      const value = control.value;
      if (Array.isArray(value)) {
        return value.length > 0 ? null : { required: true };
      }

      if (value instanceof FileList) {
        return value.length > 0 ? null : { required: true };
      }

      return value ? null : { required: true };
    };
  }

  protected onFileChange(event: Event, field: FormFieldConfig): void {
    const target = event.target as HTMLInputElement;
    const files = target.files ? Array.from(target.files) : [];
    const control = this.form()?.get(field.key);

    if (!control) {
      return;
    }

    control.setValue(files);
    control.markAsTouched();
    control.updateValueAndValidity();
  }

  protected getSelectedFilesLabel(fieldKey: string): string {
    const value = this.form()?.get(fieldKey)?.value;
    if (!value || !Array.isArray(value) || value.length === 0) {
      return 'Aucun fichier sélectionné';
    }

    return value.map((file: File) => file.name).join(', ');
  }

  protected getExistingImages(field: FormFieldConfig): string[] {
    const key = field.existingImageField ?? field.key;
    return this.existingImageUrls()[key] ?? [];
  }

  protected canDeleteImage(field: FormFieldConfig): boolean {
    return this.mode() === 'edit' && !!field.imageDeleteEndpoint;
  }

  protected isDeletingImage(imageUrl: string): boolean {
    return !!this.deletingImageUrls()[imageUrl];
  }

  protected deleteExistingImage(field: FormFieldConfig, imageUrl: string): void {
    if (!field.imageDeleteEndpoint || this.isDeletingImage(imageUrl)) {
      return;
    }

    const endpoint = this.resolveEndpoint(field.imageDeleteEndpoint);
    const queryParam = field.imageDeleteQueryParam ?? 'imageUrl';
    const params = new HttpParams().set(queryParam, imageUrl);

    this.deletingImageUrls.update((state) => ({
      ...state,
      [imageUrl]: true
    }));

    this.http
      .delete(endpoint, { params })
      .pipe(
        finalize(() => {
          this.deletingImageUrls.update((state) => ({
            ...state,
            [imageUrl]: false
          }));
        })
      )
      .subscribe({
        next: () => {
          this.deletedImageUrls.update((deleted) => [...deleted, imageUrl]);
          this.form()?.get(field.key)?.updateValueAndValidity();
        },
        error: (error: unknown) => {
          console.error('Erreur suppression image:', error);
        }
      });
  }

  private resolveEndpoint(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.apiUrl}${normalizedEndpoint}`;
  }

  private extractImageUrls(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item && typeof item === 'object' && 'url' in item) {
          const url = (item as { url?: unknown }).url;
          return typeof url === 'string' ? url : null;
        }

        return null;
      })
      .filter((url): url is string => !!url);
  }

  protected getErrorMessage(field: FormFieldConfig): string {
    const control = this.form()?.get(field.key);
    if (!control?.errors) return '';

    const errors = control.errors;

    // Check custom error messages first
    if (field.errorMessages) {
      for (const errorKey of Object.keys(errors)) {
        if (field.errorMessages[errorKey]) {
          return field.errorMessages[errorKey];
        }
      }
    }

    // Check validators with custom messages
    if (field.validators) {
      for (const validator of field.validators) {
        if (errors[validator.type]) {
          return validator.message;
        }
      }
    }

    // Default error messages
    if (errors['required']) return `${field.label} est requis`;
    if (errors['email']) return 'Email invalide';
    if (errors['minlength'])
      return `Minimum ${errors['minlength'].requiredLength} caractères`;
    if (errors['maxlength'])
      return `Maximum ${errors['maxlength'].requiredLength} caractères`;
    if (errors['min']) return `Valeur minimum: ${errors['min'].min}`;
    if (errors['max']) return `Valeur maximum: ${errors['max'].max}`;
    if (errors['pattern']) return 'Format invalide';

    return 'Erreur de validation';
  }

  protected hasError(fieldKey: string): boolean {
    const control = this.form()?.get(fieldKey);
    return !!(control?.invalid && control?.touched);
  }

  protected onSubmit(): void {
    const currentForm = this.form();
    if (currentForm?.valid) {
      this.formSubmit.emit(currentForm.getRawValue());
    } else {
      this.markAllAsTouched();
    }
  }

  protected onCancel(): void {
    this.formCancel.emit();
  }

  protected onDelete(): void {
    this.formDelete.emit();
  }

  private markAllAsTouched(): void {
    const currentForm = this.form();
    if (currentForm) {
      Object.keys(currentForm.controls).forEach((key) => {
        currentForm.get(key)?.markAsTouched();
      });
    }
  }

  // Public method to reset the form
  reset(): void {
    this.form()?.reset();
  }

  // Public method to get form values
  getValue(): Record<string, unknown> | null {
    return this.form()?.getRawValue() ?? null;
  }

  // Public method to set form values
  setValue(data: Record<string, unknown>): void {
    this.form()?.patchValue(data);
  }
}
