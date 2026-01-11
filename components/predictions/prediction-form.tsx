'use client';

import { useState, useCallback, useMemo } from 'react';
import { FormField, JSONSchema } from '@/types';
import { parseInputSchema, getSchemaDefaults } from '@/lib/schema-parser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { FileUpload } from '@/components/ui/file-upload';
import { SkeletonForm } from '@/components/ui/skeleton';
import { Play, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PredictionFormProps {
  schema: JSONSchema | null;
  onSubmit: (input: Record<string, unknown>) => void;
  isSubmitting?: boolean;
  initialValues?: Record<string, unknown>;
}

export function PredictionForm({
  schema,
  onSubmit,
  isSubmitting,
  initialValues,
}: PredictionFormProps) {
  const fields = useMemo(() => parseInputSchema(schema), [schema]);
  const defaults = useMemo(() => getSchemaDefaults(schema), [schema]);
  
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    ...defaults,
    ...initialValues,
  }));
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Separate required and optional fields
  const { requiredFields, optionalFields } = useMemo(() => {
    const required: FormField[] = [];
    const optional: FormField[] = [];
    
    fields.forEach((field) => {
      if (field.required) {
        required.push(field);
      } else {
        optional.push(field);
      }
    });
    
    return { requiredFields: required, optionalFields: optional };
  }, [fields]);

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setValues({ ...defaults, ...initialValues });
  }, [defaults, initialValues]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      
      // Filter out empty/undefined values
      const input: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(values)) {
        if (value !== undefined && value !== null && value !== '') {
          input[key] = value;
        }
      }
      
      onSubmit(input);
    },
    [values, onSubmit]
  );

  if (!schema || fields.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No input schema available for this model.</p>
        <p className="text-sm mt-2">This model may not be configured correctly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Required Fields */}
      {requiredFields.map((field) => (
        <FormFieldInput
          key={field.name}
          field={field}
          value={values[field.name]}
          onChange={(value) => handleChange(field.name, value)}
        />
      ))}

      {/* Optional Fields (Collapsible) */}
      {optionalFields.length > 0 && (
        <div className="border-t border-gray-800 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {showAdvanced ? 'Hide' : 'Show'} advanced options ({optionalFields.length})
          </button>
          
          {showAdvanced && (
            <div className="mt-4 space-y-6">
              {optionalFields.map((field) => (
                <FormFieldInput
                  key={field.name}
                  field={field}
                  value={values[field.name]}
                  onChange={(value) => handleChange(field.name, value)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
        <Button type="submit" loading={isSubmitting} className="flex-1">
          <Play className="h-4 w-4 mr-2" />
          Run Model
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

// Individual field renderer
interface FormFieldInputProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FormFieldInput({ field, value, onChange }: FormFieldInputProps) {
  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          label={field.label}
          hint={field.description}
          value={String(value ?? field.default ?? '')}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          placeholder={`Enter ${field.label.toLowerCase()}...`}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          label={field.label}
          hint={field.description}
          value={value !== undefined ? String(value) : String(field.default ?? '')}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.step}
        />
      );

    case 'slider':
      return (
        <Slider
          label={field.label}
          hint={field.description}
          value={Number(value ?? field.default ?? field.min ?? 0)}
          onChange={onChange}
          min={field.min}
          max={field.max}
          step={field.step}
          required={field.required}
        />
      );

    case 'select':
      return (
        <Select
          label={field.label}
          hint={field.description}
          value={String(value ?? field.default ?? '')}
          onChange={onChange}
          options={(field.options || []).map((opt) => ({
            label: String(opt.label),
            value: String(opt.value),
          }))}
          required={field.required}
        />
      );

    case 'boolean':
      return (
        <Switch
          label={field.label}
          hint={field.description}
          checked={Boolean(value ?? field.default ?? false)}
          onChange={onChange}
        />
      );

    case 'file':
      return (
        <FileUpload
          label={field.label}
          hint={field.description}
          value={value as string | null}
          onChange={onChange}
          accept={field.accept}
          required={field.required}
        />
      );

    case 'array':
    case 'json':
      return (
        <Textarea
          label={field.label}
          hint={`${field.description || ''} (Enter as JSON)`}
          value={value ? JSON.stringify(value, null, 2) : ''}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              // Keep as string if invalid JSON
            }
          }}
          required={field.required}
          placeholder="[]"
          className="font-mono text-sm"
        />
      );

    case 'text':
    default:
      return (
        <Input
          type="text"
          label={field.label}
          hint={field.description}
          value={String(value ?? field.default ?? '')}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          placeholder={`Enter ${field.label.toLowerCase()}...`}
        />
      );
  }
}
