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
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidatorFn
} from '@angular/forms';
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

  // Inputs
  readonly config = input.required<DynamicFormConfig>();
  readonly initialData = input<Record<string, unknown>>();
  readonly loading = input<boolean>(false);

  // Outputs
  readonly formSubmit = output<Record<string, unknown>>();
  readonly formCancel = output<void>();

  // Internal state
  protected readonly form = signal<FormGroup | null>(null);
  protected readonly isFormValid = signal<boolean>(false);

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
      const initialValue = this.initialData()?.[field.key] ?? '';
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
      validators.push(Validators.required);
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
